import {getAuthState} from '@codeimage/store/auth/auth';
import {
  getInitialEditorState,
  getInitialEditorUiOptions,
} from '@codeimage/store/editor/editor';
import {getInitialFrameState} from '@codeimage/store/editor/frame';
import {
  PersistedEditorState,
  PersistedTerminalState,
} from '@codeimage/store/editor/model';
import {getInitialTerminalState} from '@codeimage/store/editor/terminal';
import {PersistedFrameState} from '@codeimage/store/frame/model';
import {createUniqueId} from '@codeimage/store/plugins/unique-id';
import {createContextProvider} from '@solid-primitives/context';
import {createResource, createSignal} from 'solid-js';
import {API} from '../../data-access/api';

type DashboardViewMode = 'grid' | 'list';

export type WorkspaceMetadata = {
  id: string;
  created_at: string;
  frame: PersistedFrameState;
  terminal: PersistedTerminalState;
  options: PersistedEditorState['options'];
  editors: PersistedEditorState['editors'];
};

export interface WorkspaceItem {
  id: string;
  created_at: string;
  name: string;
  snippetId: string;
  snippets: WorkspaceMetadata;
  userId: string;
}

async function fetchWorkspaceContent(): Promise<WorkspaceItem[]> {
  const authState = getAuthState();
  const userId = authState.user()?.user?.id;
  if (!userId) return [];
  return API.workpace.getWorkspaceContent(userId);
}

function makeDashboardState() {
  const [mode, setMode] = createSignal<DashboardViewMode>('grid');

  const [data, {mutate}] = createResource(fetchWorkspaceContent, {
    initialValue: [],
  });

  async function createNewProject() {
    const userId = getAuthState().user()?.user?.id;
    if (!userId) {
      return;
    }
    const editor = {...getInitialEditorState(), id: createUniqueId()};
    const data = {
      terminal: getInitialTerminalState(),
      frame: getInitialFrameState(),
      options: getInitialEditorUiOptions(),
      editors: [{...editor, code: editor.code}],
    };

    return API.workpace.createNewProject(userId, data);
  }

  async function deleteProject(item: WorkspaceItem) {
    mutate(items => items.filter(i => i.id !== item.id));
    await API.workpace.deleteProject(item);
  }

  return {
    mode,
    setMode,
    data,
    mutateData: mutate,
    createNewProject,
    deleteProject,
  };
}

export const [DashboardProvider, getDashboardState] =
  createContextProvider(makeDashboardState);
