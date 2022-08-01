import {ProjectSchema} from '@codeimage/api/api-types';
import {supabase} from '@core/constants/supabase';
import {WorkspaceItem} from '../pages/Dashboard/dashboard.state';

export async function deleteProject(
  userId: string,
  item: WorkspaceItem,
): Promise<ProjectSchema.ProjectDeleteResponse> {
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
  data: ProjectSchema.ProjectCreateRequest,
): Promise<ProjectSchema.ProjectCreateResponse> {
  const headers = new Headers();
  headers.set('user-id', userId);
  headers.set('Content-Type', 'application/json');

  return fetch('/api/v1/project', {
    method: 'POST',
    headers,
    body: JSON.stringify(data),
  }).then(res => res.json());
}

export async function loadSnippet(
  userId: string | null | undefined,
  projectId: string,
): Promise<ProjectSchema.ProjectGetByIdResponse> {
  const headers = new Headers();
  if (userId) {
    headers.set('user-id', userId);
  }

  return fetch(`/api/v1/project/${projectId}`, {
    method: 'GET',
    headers,
  }).then(res => res.json());
}
