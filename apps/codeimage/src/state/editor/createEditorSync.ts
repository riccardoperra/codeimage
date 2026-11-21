import type * as ApiTypes from '@codeimage/api/api-types';
import {getAuth0State} from '@codeimage/store/auth/auth0';
import {getEditorStore} from '@codeimage/store/editor/index';
import type {ProjectEditorPersistedState} from '@codeimage/store/editor/model';
import {parseSignature} from '@codeimage/store/frame/model';
import {createResource} from '@codeimage/store/plugins/create-resource';
import {loadDefaultSignature} from '@codeimage/store/signatures/signatures';
import {notifications} from '@ui/notifications';
import {appEnvironment} from '@core/configuration';
import {useNavigate} from '@solidjs/router';
import type {ParentProps} from 'solid-js';
import {
  createComponent,
  createContext,
  createEffect,
  createSignal,
  flush,
  onCleanup,
  snapshot,
  useContext,
} from 'solid-js';
import {API} from '../../data-access/api';
import {useIdb} from '../../hooks/use-indexed-db';
import {createRemoteSaves} from './remoteSync';

type Project = ApiTypes.GetProjectByIdApi['response'];

const documentKey = (snippetId?: string | null) =>
  snippetId ? 'project-document' : 'document';

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
    terminalStore.setState(draft => {
      Object.assign(draft, data.terminal, {
        surface: data.terminal.surface ?? 'solid',
      });
    });
    frameStore.setStore(draft => {
      Object.assign(draft, data.frame, {
        signature: parseSignature(data.frame.signature),
      });
    });
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
        flush(() => {
          frameStore.setFromPersistedState(state.frame);
          terminalStore.setFromPersistedState(state.terminal);
          editorStore.actions.setFromPersistedState(state.editor);
          animationStore.actions.setFromPersistedState(state.animation);
        });
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
      notifications.show({
        tone: 'danger',
        description: 'An error occurred while saving',
        theme: 'page',
      });
    }
  }

  const remote = createRemoteSaves(
    {id: () => activeWorkspace()?.id, loggedIn: authState.loggedIn, readOnly},
    saveRemote,
    setRemoteSync,
  );
  const local = new Map<string, ReturnType<typeof setTimeout>>();
  const persist = (
    animation?: ReturnType<typeof animationStore.stateToPersist>,
  ) => {
    if (!isReady()) return;
    const state = stateToPersist(animation);
    remote.schedule(state);
    const key = documentKey(state.$snippetId);
    clearTimeout(local.get(key));
    local.set(
      key,
      setTimeout(() => {
        local.delete(key);
        void idb.set(key, state);
      }, 250),
    );
  };
  const current = () => persist();
  const unsubscribe = [
    frameStore.onPersistedChange(current),
    terminalStore.onPersistedChange(current),
    editorStore.onPersistedChange(current),
    animationStore.onPersistedChange(persist),
  ];

  onCleanup(() => {
    const workspace = activeWorkspace();
    if (workspace && remoteSync() && !readOnly() && authState.loggedIn()) {
      void saveRemote(workspace.id, stateToPersist());
    }
    remote.dispose();
    for (const timer of local.values()) clearTimeout(timer);
    for (const stop of unsubscribe) stop();
  });

  return {
    indexedDbState: () =>
      idb.get<ProjectEditorPersistedState>(documentKey(snippetId())),
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
