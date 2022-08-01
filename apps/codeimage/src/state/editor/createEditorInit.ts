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
import {
  SnippetEditorOptions,
  SnippetTerminal,
  SnippetFrame,
  SnippetEditorTab,
  WorkspaceItem as PrismaWorkspaceItem,
} from '@codeimage/prisma-models';
import {ProjectSchema} from '@codeimage/api/bff-types';

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
    if (snippetId) {
      const storedWorkspaceData = await API.workpace.loadSnippet(snippetId);
      if (storedWorkspaceData.data) {
        updateStateFromRemote(storedWorkspaceData.data);
      }
      return storedWorkspaceData?.data;
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

  function updateStateFromRemote(data: WorkspaceItem) {
    setActiveWorkspace(data);
    editorStore.actions.setFromWorkspace(data);
    terminalStore.setState(state => ({
      ...state,
      ...data.snippet.terminal,
    }));
    frameStore.setStore(state => ({...state, ...data.snippet.frame}));
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
          const dataToSave: ProjectSchema.ProjectCreateRequest = {
            frame,
            terminal,
            editors,
            options,
          };

          const workspace = untrack(activeWorkspace);
          if (!workspace) return;

          if (activeWorkspace()) {
            const snippet = await API.workpace.updateSnippet(
              workspace.snippetId,
              dataToSave,
            );
            if (!snippet) return;
            // setActiveWorkspace({
            //   ...workspace,
            //   snippets: snippet,
            // });
          } else {
            const userId = getAuthState().user()?.user?.id;
            if (!userId) return;
            const workspaceItem = await API.workpace.createSnippet(
              userId,
              dataToSave,
            );
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
