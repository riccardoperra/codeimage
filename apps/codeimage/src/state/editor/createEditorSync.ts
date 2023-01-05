import type * as ApiTypes from '@codeimage/api/api-types';
import {getAuth0State} from '@codeimage/store/auth/auth0';
import {getRootEditorStore} from '@codeimage/store/editor';
import {getFrameState} from '@codeimage/store/editor/frame';
import {getEditorStore} from '@codeimage/store/editor/index';
import {ProjectEditorPersistedState} from '@codeimage/store/editor/model';
import {getTerminalState} from '@codeimage/store/editor/terminal';
import {toast} from '@codeimage/ui';
import {appEnvironment} from '@core/configuration';
import {createContextProvider} from '@solid-primitives/context';
import {useNavigate} from '@solidjs/router';
import {
  catchError,
  debounceTime,
  EMPTY,
  filter,
  from,
  map,
  merge,
  switchMap,
  tap,
} from 'rxjs';
import {
  createEffect,
  createMemo,
  createResource,
  createSignal,
  on,
  onCleanup,
  onMount,
  Resource,
  untrack,
} from 'solid-js';
import {unwrap} from 'solid-js/store';
import {API} from '../../data-access/api';
import {useIdb} from '../../hooks/use-indexed-db';

type ProjectResponse = Awaited<ReturnType<typeof API.project.loadSnippet>>;

function createEditorSyncAdapter(props: {snippetId: string}) {
  const snippetId = createMemo(() => props.snippetId);
  const [remoteSync, setRemoteSync] = createSignal(false);
  const [readOnly, setReadonly] = createSignal(false);
  const [activeWorkspace, setActiveWorkspace] = createSignal<
    ApiTypes.GetProjectByIdApi['response'] | null
  >();
  const authState = getAuth0State();
  const frameStore = getFrameState();
  const terminalStore = getTerminalState();
  const editorStore = getRootEditorStore();
  const store = getEditorStore();
  const idb = useIdb();
  const navigate = useNavigate();

  const [loadedSnippet, {refetch}] = createResource(
    snippetId,
    async (snippetId, fetcherInfo) => {
      if (fetcherInfo.refetching === 'CLONE') {
        setReadonly(false);
        return fetcherInfo.value;
      }
      try {
        const loadedProject = await API.project.loadSnippet(snippetId);
        if (loadedProject) {
          updateStateFromRemote(loadedProject);
        }
        setReadonly(!loadedProject.isOwner);
        return loadedProject;
      } catch (e) {
        navigate('/404');
      }
    },
  );

  createEffect(() => {
    if (!snippetId()) {
      idb
        .get<ProjectEditorPersistedState>('document')
        .then(idbState => {
          if (idbState && !idbState.$snippetId) {
            editorStore.actions.setFromPersistedState(idbState.editor);
            frameStore.setFromPersistedState(idbState.frame);
            terminalStore.setFromPersistedState(idbState.terminal);
          }
        })
        .catch(() => null);
    }
  });

  const isReadyToSync = () => {
    const loading = loadedSnippet.loading,
      initialized = store.initialized();
    return !loading && initialized;
  };

  const onChange$ = merge(
    frameStore.stateToPersist$,
    terminalStore.stateToPersist$,
    editorStore.stateToPersist$,
  ).pipe(
    filter(() => isReadyToSync()),
    map(
      () =>
        [
          frameStore.stateToPersist(),
          terminalStore.stateToPersist(),
          editorStore.stateToPersist(),
        ] as const,
    ),
  );

  createEffect(() => {
    if (loadedSnippet.error) {
      navigate('/404');
    }
  });

  createEffect(
    on(store.initialized, ready => {
      if (ready) {
        const subscription = onChange$.pipe(debounceTime(250)).subscribe(() => {
          const state: ProjectEditorPersistedState = unwrap({
            $snippetId: untrack(snippetId) ?? null,
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

  async function clone() {
    if (!authState.loggedIn()) {
      navigate('/');
      refetch('CLONE');
    } else {
      const projectId = snippetId();
      if (!projectId) return;
      await new Promise(r => setTimeout(r, 100));
      return API.project
        .cloneSnippet(projectId, {
          body: {},
        })
        .then(({id}) => navigate(`/${id}`));
    }
  }

  function initRemoteDbSync() {
    const subscription = onChange$
      .pipe(
        debounceTime(150),
        filter(() => authState.loggedIn()),
        tap(() => setRemoteSync(true)),
        debounceTime(3000),
        tap(() => setRemoteSync(false)),
        switchMap(([frame, terminal, {editors, options}]) => {
          const workspace = activeWorkspace();
          if (!workspace) return EMPTY;
          const dataToSave: ApiTypes.UpdateProjectApi['request']['body'] = {
            frame,
            terminal,
            editors,
            editorOptions: options,
          };
          return from(
            API.project.updateSnippet({
              body: dataToSave,
              params: {id: workspace.id},
            }),
          ).pipe(
            catchError(() => {
              toast.error('An error occurred while saving');
              return EMPTY;
            }),
          );
        }),
      )
      .subscribe();

    return onCleanup(() => {
      const workspace = untrack(activeWorkspace);
      if (!workspace) return;
      if (activeWorkspace() && remoteSync()) {
        const snippet = API.project
          .updateSnippet({
            body: {
              frame: frameStore.stateToPersist(),
              terminal: terminalStore.stateToPersist(),
              editors: editorStore.stateToPersist().editors,
              editorOptions: editorStore.stateToPersist().options,
            },
            params: {id: workspace.id},
          })
          .then();
        if (!snippet) return;
      }
      subscription.unsubscribe();
    });
  }

  onMount(() => {
    initRemoteDbSync();
  });

  return {
    indexedDbState: () => idb.get<ProjectEditorPersistedState>('document'),
    loadedSnippet: loadedSnippet as Resource<ProjectResponse>,
    readOnly,
    clone,
    snippetId,
    activeWorkspace,
    setActiveWorkspace,
    remoteSync,
    initRemoteDbSync,
  } as const;
}

export const [EditorSyncProvider, getEditorSyncAdapter] = createContextProvider(
  createEditorSyncAdapter,
);
