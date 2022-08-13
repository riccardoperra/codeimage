import type * as ApiTypes from '@codeimage/api/api-types';
import {makeFetch} from './client';

export async function deleteProject(
  request: ApiTypes.DeleteProjectApi['request'],
): Promise<ApiTypes.DeleteProjectApi['response']> {
  return makeFetch(`/api/v1/project/:id`, {
    method: 'DELETE',
    params: {
      id: request.params?.id,
    },
  }).then(res => res.json());
}

export async function updateSnippetName(
  data: ApiTypes.UpdateProjectNameApi['request'],
): Promise<ApiTypes.UpdateProjectNameApi['response']> {
  return makeFetch('/api/v1/project/:id/name', {
    method: 'PUT',
    params: {
      id: data.params?.id,
    },
    body: data.body,
  }).then(res => res.json());
}

export async function getWorkspaceContent(): Promise<
  ApiTypes.GetProjectByIdApi['response'][]
> {
  return makeFetch(`/api/v1/project`, {
    method: 'GET',
  }).then(res => res.json());
}

export async function updateSnippet(
  data: ApiTypes.UpdateProjectApi['request'],
) {
  return makeFetch('/api/v1/project/:id', {
    method: 'PUT',
    params: {
      id: data.params?.id,
    },
    body: data.body,
  });
}

export async function createSnippet(
  request: ApiTypes.CreateProjectApi['request'],
): Promise<ApiTypes.CreateProjectApi['response']> {
  return makeFetch(`/api/v1/project`, {
    method: 'POST',
    body: request.body,
  }).then(res => res.json());
}

export async function loadSnippet(
  projectId: string,
): Promise<ApiTypes.GetProjectByIdApi['response']> {
  return makeFetch(`/api/v1/project/:id`, {
    method: 'GET',
    params: {
      id: projectId,
    },
  }).then(res => res.json());
}
