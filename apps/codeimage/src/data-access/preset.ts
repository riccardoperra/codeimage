import type * as ApiTypes from '@codeimage/api/api-types';
import {makeFetch} from './client';

const env = import.meta.env;
const BASE_URL = env.VITE_API_BASE_URL ?? '';

export async function deletePreset(
  request: ApiTypes.DeletePresetApi['request'],
): Promise<ApiTypes.DeletePresetApi['response']> {
  return makeFetch(`${BASE_URL}/api/v1/preset/:id`, {
    method: 'DELETE',
    params: {
      id: request.params?.id,
    },
  }).then(res => res.json());
}

export async function updateSnippetName(
  data: ApiTypes.UpdateProjectNameApi['request'],
): Promise<ApiTypes.UpdateProjectNameApi['response']> {
  return makeFetch(`${BASE_URL}/api/v1/project/:id/name`, {
    method: 'PUT',
    params: {
      id: data.params?.id,
    },
    body: data.body,
  }).then(res => res.json());
}

export async function getUserPresets(): Promise<
  ApiTypes.GetPresetByIdApi['response'][]
> {
  return makeFetch(`${BASE_URL}/api/v1/project`, {
    method: 'GET',
  }).then(res => res.json());
}

export async function updateSnippet(
  data: ApiTypes.UpdateProjectApi['request'],
): Promise<ApiTypes.UpdateProjectApi['response']> {
  return makeFetch(`${BASE_URL}/api/v1/project/:id`, {
    method: 'PUT',
    params: {
      id: data.params?.id,
    },
    body: data.body,
  }).then(res => res.json());
}

export async function createPreset(
  request: ApiTypes.CreatePresetApi['request'],
): Promise<ApiTypes.CreatePresetApi['response']> {
  return makeFetch(`${BASE_URL}/api/v1/preset`, {
    method: 'POST',
    body: request.body,
  }).then(res => res.json());
}

export async function getAllPresets(
  request: ApiTypes.GetAllPresetApi['request'],
): Promise<ApiTypes.GetAllPresetApi['response']> {
  return makeFetch(`${BASE_URL}/api/v1/preset`, {
    method: 'GET',
    body: request.body,
  }).then(res => res.json());
}

export async function loadSnippet(
  projectId: string,
): Promise<ApiTypes.GetProjectByIdApi['response']> {
  return makeFetch(`${BASE_URL}/api/v1/project/:id`, {
    method: 'GET',
    params: {
      id: projectId,
    },
  }).then(res => res.json());
}

export async function cloneSnippet(
  projectId: string,
  request: ApiTypes.CloneProjectApi['request'],
): Promise<ApiTypes.CloneProjectApi['response']> {
  return makeFetch(`${BASE_URL}/api/v1/project/:id/clone`, {
    method: 'POST',
    params: {
      id: projectId,
    },
    body: request.body,
  }).then(res => res.json());
}
