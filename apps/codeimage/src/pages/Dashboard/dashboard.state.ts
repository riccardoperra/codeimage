import type * as ApiTypes from '@codeimage/api/api-types';
import {getAuth0State} from '@codeimage/store/auth/auth0';
import {getInitialEditorUiOptions} from '@codeimage/store/editor/editor';
import {getInitialFrameState} from '@codeimage/store/editor/frame';
import {loadDefaultSignature} from '@codeimage/store/signatures/signatures';
import {getInitialTerminalState} from '@codeimage/store/editor/terminal';
import {getThemeStore} from '@codeimage/store/theme/theme.store';
import {createResource} from '@codeimage/store/plugins/create-resource';
import {createPagedData} from '@codeimage/ui';
import {appEnvironment} from '@core/configuration';
import type {ParentProps} from 'solid-js';
import {
  createComponent,
  createContext,
  createEffect,
  createSignal,
  useContext,
} from 'solid-js';
import {API} from '../../data-access/api';

function makeDashboardState(authState = getAuth0State()) {
  const [data, {mutate, refetch}] = createResource(fetchWorkspaceContent, {
    initialValue: [],
  });

  const [search, setSearch] = createSignal('');
  const pageSize = 9;
  const filteredData = () => {
    const searchValue = search();
    const projects = data.latest;
    if (searchValue.length <= 2) return projects;
    const query = searchValue.toLowerCase();
    return projects.filter(item => item.name.toLowerCase().includes(query));
  };

  const [pagedData, paginationState] = createPagedData(filteredData, {
    pageSize,
    pageSelected: 1,
  });

  createEffect(search, searchValue => {
    if (searchValue.length > 2) paginationState.setPage(1);
  });

  async function fetchWorkspaceContent(): Promise<
    ApiTypes.GetProjectByIdApi['response'][]
  > {
    const userId = authState.user()?.id;
    if (!userId) return [];
    return API.project.getWorkspaceContent();
  }

  async function createNewProject() {
    const theme = await getThemeStore().getThemeDef('fleetDark')?.load();

    const frame = getInitialFrameState();
    const signature = await loadDefaultSignature().catch(() => null);

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
          ...(signature ? {signature} : {}),
        },
        editors: [
          {
            code: appEnvironment.defaultState.editor.code,
            languageId: appEnvironment.defaultState.editor.languageId,
            tabName: 'index.tsx',
            lineNumberStart: 1,
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
        return (
          data.error === undefined && !data.loading && data.latest.length === 0
        );
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
    paginationState,
  };
}

const DashboardContext = createContext<ReturnType<typeof makeDashboardState>>();

export function DashboardProvider(props: ParentProps) {
  const state = makeDashboardState();
  return createComponent(DashboardContext, {
    value: state,
    get children() {
      return props.children;
    },
  });
}

export function getDashboardState() {
  return useContext(DashboardContext);
}
