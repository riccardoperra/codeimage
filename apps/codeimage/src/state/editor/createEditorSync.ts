import type * as ApiTypes from '@codeimage/api/api-types';
import {getAuth0State} from '@codeimage/store/auth/auth0';
import {getEditorStore} from '@codeimage/store/editor/index';
import type {ProjectEditorPersistedState} from '@codeimage/store/editor/model';
import {parseSignature} from '@codeimage/store/frame/model';
import {createResource} from '@codeimage/store/plugins/create-resource';
import {loadDefaultSignature} from '@codeimage/store/signatures/signatures';
import {toast} from '@codeimage/ui';
import {appEnvironment} from '@core/configuration';
import {useNavigate} from '@solidjs/router';
import {debounceTime, filter, map, merge, share} from 'rxjs';
import type {ParentProps} from 'solid-js';
import {
  createComponent,
  createContext,
  createEffect,
  createSignal,
  onSettled,
  snapshot,
  useContext,
} from 'solid-js';
import {API} from '../../data-access/api';
import {useIdb} from '../../hooks/use-indexed-db';
import {remoteSaves} from './remoteSync';

type Project = ApiTypes.GetProjectByIdApi['response'];

function createEditorSyncAdapter(props: ParentProps<{snippetId?: string}>) {
  const snippetId = () => props.snippetId;
  const [remoteSync, setRemoteSync] = createSignal(false);
  const [readOnly, setReadonly] = createSignal(false);
  const [activeWorkspace, setActiveWorkspace] = createSignal<Project | null>(
    null,
  );
  const [localReady, setLocalReady] = createSignal(false);

  const authState = getAuth0State();
  const {
    frame: frameStore,
    terminal: terminalStore,
    editor: editorStore,
    animation: animationStore,
    initialized,
  } = getEditorStore();
  const idb = useIdb();
  const navigate = useNavigate();

  const [loadedSnippet] = createResource(snippetId, id =>
    API.project.loadSnippet(id),
  );

  function updateStateFromRemote(data: Project) {
    setActiveWorkspace(data);
    setReadonly(!data.isOwner);
    editorStore.actions.setFromWorkspace(data);
    animationStore.actions.setFromPersistedState(data.animation);
    terminalStore.setState(state => ({
      ...state,
      ...data.terminal,
      surface: data.terminal.surface ?? 'solid',
    }));
    frameStore.setStore(state => ({
      ...state,
      ...data.frame,
      signature: parseSignature(data.frame.signature),
    }));
  }

  createEffect(snippetId, id => {
    setRemoteSync(false);
    setReadonly(false);
    setActiveWorkspace(null);
    setLocalReady(false);
    if (id) return;

    let stale = false;
    async function restoreLocal() {
      const state = await idb.get<ProjectEditorPersistedState>('document');
      if (stale) return;
      if (state && !state.$snippetId) {
        editorStore.actions.setFromPersistedState(state.editor);
        animationStore.actions.setFromPersistedState(state.animation);
        frameStore.setFromPersistedState(state.frame);
        terminalStore.setFromPersistedState(state.terminal);
      } else if (!state) {
        const signature = await loadDefaultSignature();
        if (!stale && signature && !frameStore.store.signature) {
          frameStore.setSignature(signature);
        }
      }
    }

    restoreLocal()
      .catch(() => undefined)
      .finally(() => {
        if (!stale) setLocalReady(true);
      });
    return () => {
      stale = true;
    };
  });

  createEffect(
    () => [snippetId(), loadedSnippet.state, loadedSnippet.latest] as const,
    ([id, status, project]) => {
      if (!id) return;
      if (status === 'errored') {
        navigate('/404');
        return;
      }
      if (status === 'ready' && project?.id === id) {
        updateStateFromRemote(project);
      }
    },
  );

  const isReady = () => {
    const id = snippetId();
    return (
      initialized() &&
      (id
        ? loadedSnippet.state === 'ready' && activeWorkspace()?.id === id
        : localReady())
    );
  };

  function stateToPersist(
    animation = animationStore.stateToPersist(),
  ): ProjectEditorPersistedState {
    return snapshot({
      $snippetId: snippetId() ?? null,
      $version: appEnvironment.version,
      frame: frameStore.stateToPersist(),
      terminal: terminalStore.stateToPersist(),
      editor: editorStore.stateToPersist(),
      animation,
    });
  }

  const currentState = () => stateToPersist();
  const onChange$ = merge(
    frameStore.stateToPersist$.pipe(map(() => currentState)),
    terminalStore.stateToPersist$.pipe(map(() => currentState)),
    editorStore.stateToPersist$.pipe(map(() => currentState)),
    animationStore.stateToPersist$.pipe(
      map(animation => () => stateToPersist(animation)),
    ),
  ).pipe(
    filter(isReady),
    map(read => read()),
    share(),
  );

  async function clone() {
    const projectId = snippetId();
    if (!projectId) return;

    if (!authState.loggedIn()) {
      setReadonly(false);
      navigate('/');
      return;
    }

    await new Promise(resolve => setTimeout(resolve, 100));
    const {id} = await API.project.cloneSnippet(projectId, {body: {}});
    navigate(`/${id}`);
  }

  async function saveRemote(
    id: string,
    {frame, terminal, editor, animation}: ProjectEditorPersistedState,
  ) {
    try {
      await API.project.updateSnippet({
        body: {
          frame,
          terminal,
          editors: editor.editors,
          editorOptions: editor.options,
          animation,
        },
        params: {id},
      });
    } catch {
      toast.error('An error occurred while saving');
    }
  }

  onSettled(() => {
    const remote = remoteSaves(
      onChange$,
      {id: () => activeWorkspace()?.id, loggedIn: authState.loggedIn, readOnly},
      saveRemote,
      setRemoteSync,
    ).subscribe();
    const local = onChange$.pipe(debounceTime(250)).subscribe(state => {
      void idb.set('document', state);
    });

    return () => {
      const workspace = activeWorkspace();
      if (workspace && remoteSync() && !readOnly() && authState.loggedIn()) {
        void saveRemote(workspace.id, stateToPersist());
      }
      remote.unsubscribe();
      local.unsubscribe();
    };
  });

  return {
    indexedDbState: () => idb.get<ProjectEditorPersistedState>('document'),
    loadedSnippet,
    readOnly,
    clone,
    snippetId,
    activeWorkspace,
    remoteSync,
  } as const;
}

const EditorSyncContext =
  createContext<ReturnType<typeof createEditorSyncAdapter>>();

export function EditorSyncProvider(props: ParentProps<{snippetId?: string}>) {
  const value = createEditorSyncAdapter(props);
  return createComponent(EditorSyncContext, {
    value,
    get children() {
      return props.children;
    },
  });
}

export function getEditorSyncAdapter() {
  return useContext(EditorSyncContext);
}
