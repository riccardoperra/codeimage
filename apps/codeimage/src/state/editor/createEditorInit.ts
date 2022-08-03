import {ApiTypes} from '@codeimage/api/api-types';
import {getAuthState} from '@codeimage/store/auth/auth';
import {getRootEditorStore} from '@codeimage/store/editor';
import {getFrameState} from '@codeimage/store/editor/frame';
import {getEditorStore} from '@codeimage/store/editor/index';
import {getTerminalState} from '@codeimage/store/editor/terminal';
import {appEnvironment} from '@core/configuration';
import {createContextProvider} from '@solid-primitives/context';
import {combineLatest, debounceTime, filter, skip, tap} from 'rxjs';
import {
  createEffect,
  createMemo,
  createResource,
  createSignal,
  on,
  onCleanup,
  untrack,
} from 'solid-js';
import {unwrap} from 'solid-js/store';
import {API} from '../../data-access/api';
import {useIdb} from '../../hooks/use-indexed-db';
import {WorkspaceItem} from '../../pages/Dashboard/dashboard.state';

function createEditorSyncAdapter() {
  const [remoteSync, setRemoteSync] = createSignal(false);
  const [data, loadData] = createSignal<{
    activeWorkspace?: WorkspaceItem | null;
    snippetId?: string | null;
  }>();
  const [activeWorkspace, setActiveWorkspace] = createSignal<WorkspaceItem>();
  const authState = getAuthState();
  const frameStore = getFrameState();
  const terminalStore = getTerminalState();
  const editorStore = getRootEditorStore();
  const store = getEditorStore();
  const idb = useIdb();

  const snippetId = createMemo(() => data()?.snippetId);

  const [loadedSnippet] = createResource(snippetId, async snippetId => {
    const userId = authState.user()?.user?.id;
    if (snippetId) {
      const storedWorkspaceData = await API.workpace.loadSnippet(
        userId,
        snippetId,
      );
      if (storedWorkspaceData) {
        updateStateFromRemote(storedWorkspaceData);
      }
      return storedWorkspaceData;
    }
  });

  const isReadyToSync = () => {
    const loading = loadedSnippet.loading,
      initialized = store.initialized();
    return !loading && initialized;
  };

  const onChange$ = combineLatest([
    frameStore.stateToPersist$,
    terminalStore.stateToPersist$,
    editorStore.stateToPersist$,
  ]).pipe(
    filter(() => isReadyToSync()),
    debounceTime(150),
    skip(1),
  );

  createEffect(
    on(isReadyToSync, ready => {
      if (ready) {
        const subscription = onChange$
          .pipe(debounceTime(1000))
          .subscribe(() => {
            const state = unwrap({
              $workspaceId: data()?.activeWorkspace?.id,
              $snippetId: data()?.activeWorkspace?.snippetId,
              $version: appEnvironment.version,
              frame: frameStore.stateToPersist(),
              terminal: terminalStore.stateToPersist(),
              editor: editorStore.stateToPersist(),
            });
            idb.set('document', state);
          });
        return onCleanup(() => subscription.unsubscribe());
      }
    }),
  );

  function updateStateFromRemote(data: ApiTypes.GetProjectByIdApi['response']) {
    setActiveWorkspace(data);
    editorStore.actions.setFromWorkspace(data);
    terminalStore.setState(state => ({
      ...state,
      ...data.terminal,
    }));
    frameStore.setStore(state => ({...state, ...data.frame}));
  }

  function initRemoteDbSync() {
    createEffect(() => {
      const subscription = onChange$
        .pipe(
          filter(() => authState.loggedIn()),
          tap(() => setRemoteSync(false)),
          debounceTime(500),
          tap(() => setRemoteSync(true)),
          debounceTime(3000),
          tap(() => setRemoteSync(false)),
        )
        .subscribe(async ([frame, terminal, {editors, options}]) => {
          const dataToSave: ApiTypes.CreateProjectApi['request']['body'] = {
            frame,
            terminal,
            editors,
            editorOptions: options,
          };

          const workspace = untrack(activeWorkspace);
          if (!workspace) return;

          if (activeWorkspace()) {
            const snippet = await API.workpace.updateSnippet(workspace.userId, {
              body: dataToSave,
              params: {id: workspace.id},
            });
            if (!snippet) return;
            // setActiveWorkspace({
            //   ...workspace,
            //   snippets: snippet,
            // });
          } else {
            const userId = getAuthState().user()?.user?.id;
            if (!userId) return;
            const workspaceItem = await API.workpace.createSnippet(userId, {
              body: dataToSave,
            });
            setActiveWorkspace(workspaceItem ?? undefined);
          }
        });

      return onCleanup(() => {
        subscription.unsubscribe();
      });
    });
  }

  return {
    loadedSnippet,
    loadData,
    activeWorkspace,
    setActiveWorkspace,
    remoteSync,
    initRemoteDbSync,
  } as const;
}

export const [EditorSyncProvider, getEditorSyncAdapter] = createContextProvider(
  createEditorSyncAdapter,
);
