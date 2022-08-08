import type * as ApiTypes from '@codeimage/api/api-types';
import {getAuthState} from '@codeimage/store/auth/auth';
import {getInitialEditorUiOptions} from '@codeimage/store/editor/editor';
import {getInitialFrameState} from '@codeimage/store/editor/frame';
import {
  PersistedEditorState,
  PersistedTerminalState,
} from '@codeimage/store/editor/model';
import {getInitialTerminalState} from '@codeimage/store/editor/terminal';
import {PersistedFrameState} from '@codeimage/store/frame/model';
import {getThemeStore} from '@codeimage/store/theme/theme.store';
import {appEnvironment} from '@core/configuration';
import {createContextProvider} from '@solid-primitives/context';
import {createResource, createSignal} from 'solid-js';
import {API} from '../../data-access/api';

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

async function fetchWorkspaceContent(): Promise<
  ApiTypes.GetProjectByIdApi['response'][]
> {
  const authState = getAuthState();
  const userId = authState.user()?.user?.id;
  if (!userId) return [];
  return API.project.getWorkspaceContent(userId);
}

function makeDashboardState() {
  const [data, {mutate}] = createResource(fetchWorkspaceContent, {
    initialValue: [],
  });

  const [search, setSearch] = createSignal('');

  const filteredData = () => {
    const searchValue = search();
    if (!data()) return [];
    if (!searchValue || searchValue.length < 2) return data();
    return data().filter(item =>
      item.name.toLowerCase().includes(searchValue.toLowerCase()),
    );
  };

  async function createNewProject() {
    const userId = getAuthState().user()?.user?.id;
    if (!userId) {
      return;
    }

    const theme = await getThemeStore().getThemeDef('vsCodeDarkTheme')?.load();

    const frame = getInitialFrameState();

    const data: ApiTypes.CreateProjectApi['request'] = {
      body: {
        name: 'Untitled',
        editorOptions: getInitialEditorUiOptions(),
        terminal: {
          ...getInitialTerminalState(),
          background: theme?.properties.terminal.main ?? null,
          textColor: theme?.properties.terminal.text ?? null,
        },
        frame: {
          visible: frame.visible ?? false,
          padding: frame.padding ?? 0,
          radius: frame.radius ?? 0,
          background:
            theme?.properties.previewBackground ?? frame.background ?? '#000',
          opacity: frame.opacity ?? 1,
        },
        editors: [
          {
            code: `from server: ${appEnvironment.defaultState.editor.code}`,
            languageId: appEnvironment.defaultState.editor.languageId,
            tabName: 'index.tsx',
          },
        ],
      },
    };

    return API.project.createSnippet(userId, data);
  }

  async function deleteProject(projectId: string) {
    const userId = getAuthState().user()?.user?.id;
    if (!userId) return;
    mutate(items => items.filter(i => i.id !== projectId));
    await API.project.deleteProject(userId, {
      params: {
        id: projectId,
      },
    });
  }

  async function updateSnippetName(
    id: string,
    oldName: string,
    newName: string | undefined,
  ) {
    const userId = getAuthState().user()?.user?.id;
    if (!userId || !newName || oldName === newName) {
      return;
    }
    mutate(items =>
      items.map(item => {
        if (item.id === id) {
          return {
            ...item,
            name: newName,
            updatedAt: new Date().toString(),
          };
        }
        return item;
      }),
    );
    await API.project.updateSnippetName(userId, {
      params: {
        id,
      },
      body: {
        name: newName,
      },
    });
  }

  return {
    data,
    search,
    setSearch,
    filteredData,
    mutateData: mutate,
    createNewProject,
    deleteProject,
    updateSnippetName,
  };
}

export const [DashboardProvider, getDashboardState] =
  createContextProvider(makeDashboardState);
