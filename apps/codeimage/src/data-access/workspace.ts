import {supabase} from '@core/constants/supabase';
import {
  WorkspaceItem,
  WorkspaceMetadata,
} from '../pages/Dashboard/dashboard.state';

export async function deleteProject(
  userId: string,
  item: WorkspaceItem,
): Promise<void> {
  const headers = new Headers();
  headers.set('user-id', userId);

  return fetch(`/api/v1/project/${item.id}`, {
    method: 'DELETE',
    headers,
  }).then(res => res.json());
}

export async function updateSnippetName(
  workspaceItemId: string,
  newName: string,
) {
  return supabase
    .from<WorkspaceItem>('workspace_item')
    .update({name: newName})
    .eq('id', workspaceItemId);
}

export async function getWorkspaceContent(userId: string): Promise<any> {
  const headers = new Headers();
  headers.set('user-id', userId);

  return fetch('/api/v1/project', {
    method: 'GET',
    headers,
  }).then(res => res.json());
}

export async function createWorkspaceItem(
  data: Pick<Omit<WorkspaceItem, 'snippet'>, 'snippetId' | 'userId'>,
) {
  return supabase
    .from<WorkspaceItem>('workspace_item')
    .insert(data)
    .then(res => res.body?.[0]);
}

export async function updateSnippet(
  snippetId: string,
  dataToSave: Pick<
    WorkspaceItem['snippet'],
    'terminal' | 'frame' | 'options' | 'editors'
  >,
) {
  return supabase
    .from<WorkspaceItem['snippet']>('snippets')
    .update(dataToSave)
    .filter('id', 'eq', snippetId)
    .then(res => res?.body?.[0]);
}

export async function createSnippet(
  userId: string,
  data: any,
): Promise<WorkspaceItem | null> {
  const headers = new Headers();
  headers.set('user-id', userId);
  headers.set('Content-Type', 'application/json');

  return fetch('/api/v1/project', {
    method: 'POST',
    headers,
    body: JSON.stringify(data),
  }).then(res => res.json());
}

export async function loadSnippet(workspaceItemId: string) {
  return supabase
    .from<WorkspaceItem>('workspace_item')
    .select('*, snippets(*)')
    .eq('id', workspaceItemId)
    .maybeSingle();
}

export async function createNewProject(
  userId: string,
  data: Pick<WorkspaceMetadata, 'terminal' | 'frame' | 'options' | 'editors'>,
) {
  const workspaceItem = await supabase
    .from<WorkspaceMetadata>('snippets')
    .insert(data)
    .then(res => res?.body?.[0]);

  if (!workspaceItem) return null;

  return supabase
    .from<WorkspaceItem>('workspace_item')
    .insert({
      snippetId: workspaceItem.id,
      userId,
    })
    .then(res => res?.body?.[0]);
}
