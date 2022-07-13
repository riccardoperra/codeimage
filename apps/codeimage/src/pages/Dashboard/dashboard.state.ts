import {getAuthState} from '@codeimage/store/auth/auth';
import {
  EditorUIOptions,
  getInitialEditorUiOptions,
} from '@codeimage/store/editor/createEditorOptions';
import {getInitialEditorState} from '@codeimage/store/editor/createEditors';
import {EditorState} from '@codeimage/store/editor/model';
import {getInitialFrameState} from '@codeimage/store/frame/createFrame';
import {FrameState} from '@codeimage/store/frame/model';
import {createUniqueId} from '@codeimage/store/plugins/unique-id';
import {TerminalState} from '@codeimage/store/terminal/model';
import {supabase} from '@core/constants/supabase';
import {createResource, createSignal} from 'solid-js';

type DashboardViewMode = 'grid' | 'list';

type WorkspaceMetadata = {
  id: string;
  created_at: string;
  frame: FrameState;
  terminal: TerminalState;
  options: EditorUIOptions;
  editors: EditorState[];
};

export interface WorkspaceItem {
  id: string;
  created_at: string;
  name: string;
  snippetId: string;
  snippets: WorkspaceMetadata;
  userId: string;
}

export type DashboardState = ReturnType<typeof $dashboardState>;

function fetchWorkspaceContent(): Promise<WorkspaceItem[]> {
  const authState = getAuthState();

  return supabase
    .from<WorkspaceItem>('workspace_item')
    .select('*, snippets(*)')
    .order('created_at', {
      ascending: false,
      nullsFirst: true,
    })
    .filter('userId', 'eq', authState.user()?.user?.id)
    .then(res => res.body ?? []) as Promise<WorkspaceItem[]>;
}

export default function $dashboardState() {
  const [mode, setMode] = createSignal<DashboardViewMode>('grid');

  const [data, {mutate}] = createResource(fetchWorkspaceContent, {
    initialValue: [],
  });

  async function createNewProject() {
    // TODO refactor
    const editor = {...getInitialEditorState(), id: createUniqueId()};
    const result = await supabase
      .from<WorkspaceMetadata>('snippets')
      .insert({
        terminal: getInitialTerminalState(),
        frame: getInitialFrameState(),
        options: getInitialEditorUiOptions(),
        editors: [{...editor, code: window.btoa(editor.code)}],
      })
      .then(res => res.body?.[0]);

    if (result) {
      return supabase
        .from<WorkspaceItem>('workspace_item')
        .insert({
          name: 'Untitled',
          snippetId: result.id,
          userId: getAuthState().user()?.user?.id,
        })
        .then(res => res.body?.[0]);
    }

    return null;
  }

  async function deleteProject(item: WorkspaceItem) {
    await supabase.from('workspace_item').delete().eq('id', item.id);
    await supabase.from('snippets').delete().eq('id', item.snippetId);
    mutate(items => items.filter(i => i.id !== item.id));
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
