import {
  SnippetEditorOptions,
  SnippetEditorTab,
  SnippetFrame,
  SnippetTerminal,
  WorkspaceItem as SnippetWorkspaceItem,
} from '@codeimage/prisma-models';
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
import {appEnvironment} from '@core/configuration';
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
  snippet: WorkspaceMetadata;
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

    type IdAndSnippetId = 'id' | 'snippetId';
    type WorkspaceRequest = {
      name: SnippetWorkspaceItem['name'];
      editorOptions: Omit<SnippetEditorOptions, IdAndSnippetId>;
      terminal: Omit<SnippetTerminal, IdAndSnippetId>;
      frame: Omit<SnippetFrame, IdAndSnippetId>;
      editors: Omit<SnippetEditorTab, IdAndSnippetId>[];
    };

    const data: WorkspaceRequest = {
      name: 'Untitled',
      editorOptions: getInitialEditorUiOptions(),
      terminal: getInitialTerminalState(),
      // @ts-expect-error TODO: fix
      frame: getInitialFrameState(),
      editors: [
        {
          code: appEnvironment.defaultState.editor.code,
          languageId: appEnvironment.defaultState.editor.languageId,
          tabName: 'index.tsx',
        },
      ],
    };

    return API.workpace.createSnippet(userId, data);
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
