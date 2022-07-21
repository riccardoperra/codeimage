import {getAuthState} from '@codeimage/store/auth/auth';
import {getRootEditorStore} from '@codeimage/store/editor';
import {getFrameState} from '@codeimage/store/editor/frame';
import {getEditorStore} from '@codeimage/store/editor/index';
import {getTerminalState} from '@codeimage/store/editor/terminal';
import {appEnvironment} from '@core/configuration';
import {supabase} from '@core/constants/supabase';
import {
  combineLatest,
  debounceTime,
  filter,
  from,
  shareReplay,
  tap,
} from 'rxjs';
import {
  createEffect,
  createResource,
  createRoot,
  createSignal,
  observable,
  on,
  onCleanup,
} from 'solid-js';
import {unwrap} from 'solid-js/store';
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

  const [loadedSnippet] = createResource(
    data,
    async ({activeWorkspace, snippetId}) => {
      if (snippetId && (!activeWorkspace || activeWorkspace.id !== snippetId)) {
        const storedWorkspaceData = await supabase
          .from<WorkspaceItem>('workspace_item')
          .select('*, snippets(*)')
          .eq('id', snippetId)
          .maybeSingle();
        if (storedWorkspaceData.data) {
          updateStateFromRemote(storedWorkspaceData.data);
        }
        return storedWorkspaceData?.data;
      } else if (activeWorkspace) {
        updateStateFromRemote(activeWorkspace);
        return activeWorkspace;
      }
      return null;
    },
  );

  const isReadyToSync = () => {
    return !loadedSnippet.loading && store.initialized();
  };

  const onChange$ = combineLatest([
    frameStore.stateToPersist$,
    terminalStore.stateToPersist$,
    editorStore.stateToPersist$,
    from(observable(activeWorkspace)),
  ]).pipe(
    filter(() => isReadyToSync()),
    debounceTime(150),
    shareReplay({refCount: true, bufferSize: 1}),
  );

  createEffect(
    on(isReadyToSync, ready => {
      if (ready) {
        const subscription = onChange$
          .pipe(debounceTime(1000))
          .subscribe(() => {
            const state = unwrap({
              $workspaceId: activeWorkspace()?.id,
              $snippetId: activeWorkspace()?.snippetId,
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
      ...data.snippets.terminal,
    }));
    frameStore.setStore(state => ({...state, ...data.snippets.frame}));
  }

  function initRemoteDbSync() {
    createEffect(() => {
      const subscription = onChange$
        .pipe(
          tap(() => setRemoteSync(false)),
          debounceTime(500),
          tap(() => setRemoteSync(true)),
          debounceTime(3000),
          tap(() => setRemoteSync(false)),
        )
        .subscribe(async ([frame, terminal, {editors, options}]) => {
          const dataToSave = {
            frame,
            terminal,
            editors,
            options,
          };

          const loggedIn = authState.loggedIn();
          if (!loggedIn) return;

          if (activeWorkspace()) {
            await supabase
              .from<WorkspaceItem['snippets']>('snippets')
              .update(dataToSave)
              .filter('id', 'eq', activeWorkspace()?.id);
          } else {
            const snippetResponse = await supabase
              .from<WorkspaceItem['snippets']>('snippets')
              .insert(dataToSave);

            if (snippetResponse.body?.[0].id) {
              return supabase
                .from<WorkspaceItem>('workspace_item')
                .insert({
                  snippetId: snippetResponse?.body?.[0].id,
                  userId: getAuthState().user()?.user?.id,
                })
                .then(res => {
                  console.log('SET ACTIVE');
                  setActiveWorkspace(() => ({
                    ...res.body?.[0]!,
                    snippets: snippetResponse.body?.[0]!,
                  }));
                });
            }
          }
        });

      return onCleanup(() => {
        subscription.unsubscribe();
      });
    });
  }

  return {
    loadData,
    activeWorkspace,
    setActiveWorkspace,
    remoteLoading: () => loadedSnippet.loading,
    remoteSync,
    initRemoteDbSync,
  };
}

export const $editorSyncAdapter = createRoot(createEditorSyncAdapter);

export function getEditorSyncAdapter() {
  return $editorSyncAdapter;
}
