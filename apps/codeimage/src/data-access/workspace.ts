import {ApiTypes} from '@codeimage/api/api-types';
import {supabase} from '@core/constants/supabase';
import {WorkspaceItem} from '../pages/Dashboard/dashboard.state';
import {makeFetch} from './client';

export async function deleteProject(
  userId: string,
  request: ApiTypes.DeleteProjectApi['request'],
): Promise<ApiTypes.DeleteProjectApi['response']> {
  return makeFetch(`/api/v1/project/:id`, {
    method: 'DELETE',
    headers: {
      'user-id': userId,
    },
    params: {
      id: request.params?.id,
    },
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
  return makeFetch(`/api/v1/project`, {
    method: 'GET',
    headers: {
      'user-id': userId,
    },
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
  request: ApiTypes.CreateProjectApi['request'],
): Promise<ApiTypes.CreateProjectApi['response']> {
  return makeFetch(`/api/v1/project`, {
    method: 'POST',
    headers: {
      'user-id': userId,
    },
    body: request.body,
  }).then(res => res.json());
}

export async function loadSnippet(
  userId: string | null | undefined,
  projectId: string,
): Promise<ApiTypes.GetProjectByIdApi['response']> {
  return makeFetch(`/api/v1/project/:id`, {
    method: 'GET',
    params: {
      id: projectId,
    },
    headers: {
      'user-id': userId,
    },
  }).then(res => res.json());
}
