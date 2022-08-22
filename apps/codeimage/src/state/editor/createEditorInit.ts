import type * as ApiTypes from '@codeimage/api/api-types';
import {getAuth0State} from '@codeimage/store/auth/auth0';
import {getRootEditorStore} from '@codeimage/store/editor';
import {getFrameState} from '@codeimage/store/editor/frame';
import {getEditorStore} from '@codeimage/store/editor/index';
import {ProjectEditorPersistedState} from '@codeimage/store/editor/model';
import {getTerminalState} from '@codeimage/store/editor/terminal';
import {appEnvironment} from '@core/configuration';
import {createContextProvider} from '@solid-primitives/context';
import {
  combineLatest,
  debounceTime,
  EMPTY,
  filter,
  of,
  skip,
  switchMap,
  tap,
  withLatestFrom,
} from 'rxjs';
import {useNavigate} from 'solid-app-router';
import {
  createEffect,
  createResource,
  createSignal,
  on,
  onCleanup,
  untrack,
} from 'solid-js';
import {unwrap} from 'solid-js/store';
import {API} from '../../data-access/api';
import {useIdb} from '../../hooks/use-indexed-db';

function createEditorSyncAdapter() {
  const [remoteSync, setRemoteSync] = createSignal(false);
  const [readOnly, setReadonly] = createSignal(false);
  const [snippetId, setSnippetId] = createSignal<string | null>(null);
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
      const loadedProject = await API.project.loadSnippet(snippetId);
      if (loadedProject) {
        console.log(loadedProject);
        updateStateFromRemote(loadedProject);
      }
      setReadonly(!loadedProject.isOwner);
      return loadedProject;
    },
  );

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
    on(store.initialized, ready => {
      if (ready) {
        const subscription = onChange$
          .pipe(debounceTime(1000))
          .subscribe(() => {
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
        filter(() => authState.loggedIn()),
        tap(() => setRemoteSync(true)),
        debounceTime(3000),
        tap(() => setRemoteSync(false)),
        withLatestFrom(of(untrack(activeWorkspace))),
        switchMap(([[frame, terminal, {editors, options}], workspace]) => {
          if (!workspace) return EMPTY;
          const dataToSave: ApiTypes.UpdateProjectApi['request']['body'] = {
            frame,
            terminal,
            editors,
            editorOptions: options,
          };
          return API.project.updateSnippet({
            body: dataToSave,
            params: {id: workspace.id},
          });
        }),
      )
      .subscribe();

    return onCleanup(() => {
      const workspace = untrack(activeWorkspace);
      if (!workspace) return;

      if (activeWorkspace()) {
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

  return {
    indexedDbState: () => idb.get<ProjectEditorPersistedState>('document'),
    loadedSnippet,
    readOnly,
    clone,
    setSnippetId,
    activeWorkspace,
    setActiveWorkspace,
    remoteSync,
    initRemoteDbSync,
  } as const;
}

export const [EditorSyncProvider, getEditorSyncAdapter] = createContextProvider(
  createEditorSyncAdapter,
);
