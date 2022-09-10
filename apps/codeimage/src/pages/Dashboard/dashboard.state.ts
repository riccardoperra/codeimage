import type * as ApiTypes from '@codeimage/api/api-types';
import {getAuth0State} from '@codeimage/store/auth/auth0';
import {getInitialEditorUiOptions} from '@codeimage/store/editor/editor';
import {getInitialFrameState} from '@codeimage/store/editor/frame';
import {getInitialTerminalState} from '@codeimage/store/editor/terminal';
import {getThemeStore} from '@codeimage/store/theme/theme.store';
import {appEnvironment} from '@core/configuration';
import {createPagedData} from '@core/modules/pagination';
import {createContextProvider} from '@solid-primitives/context';
import {createResource, createSignal, createEffect} from 'solid-js';
import {API} from '../../data-access/api';
function makeDashboardState(authState = getAuth0State()) {
  const [data, {mutate, refetch}] = createResource(fetchWorkspaceContent, {
    initialValue: [],
  });

  const [search, setSearch] = createSignal('');

  const filteredData = () => {
    const searchValue = search();
    if (!data()) return [];
    if (!searchValue || searchValue.length > 2)
      return (
        data().filter(item =>
          item.name.toLowerCase().includes(searchValue.toLowerCase()),
        ) ?? []
      );
    return [];
  };

  const [pagedData, {page, setPage, pageSize}] = createPagedData(() =>
    filteredData(),
  );

  createEffect(() => {
    const searchValue = search();
    if (!searchValue || searchValue.length > 2) setPage(1);
  });
  async function fetchWorkspaceContent(): Promise<
    ApiTypes.GetProjectByIdApi['response'][]
  > {
    const userId = authState.user()?.id;
    if (!userId) return [];
    return API.project.getWorkspaceContent();
  }
  async function createNewProject() {
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

    return API.project.createSnippet(data);
  }

  async function deleteProject(projectId: string) {
    mutate(items => items.filter(i => i.id !== projectId) ?? []);
    await API.project.deleteProject({
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
    const userId = authState.user()?.id;
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
    await API.project.updateSnippetName({
      params: {
        id,
      },
      body: {
        name: newName,
      },
    });
  }

  function cloneProject(project: ApiTypes.GetProjectByIdApi['response']) {
    const userId = authState.user()?.id;
    if (!userId) return;
    return API.project.cloneSnippet(project.id, {
      body: {
        newName: `${project.name} (copy)`,
      },
    });
  }

  return {
    data: Object.assign(data, {
      isEmpty() {
        return !data.error && !data.loading && data().length === 0;
      },
    }),
    refetch,
    search,
    setSearch,
    filteredData,
    mutateData: mutate,
    createNewProject,
    deleteProject,
    updateSnippetName,
    cloneProject,
    pagedData,
    page,
    setPage,
    pageSize,
  };
}

export const [DashboardProvider, getDashboardState] = createContextProvider(
  () => makeDashboardState(),
);
