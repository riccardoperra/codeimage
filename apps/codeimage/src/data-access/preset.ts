import type * as ApiTypes from '@codeimage/api/api-types';
import {makeFetch} from './client';

const env = import.meta.env;
const BASE_URL = env.VITE_API_BASE_URL ?? '';

declare const x: ApiTypes.DeletePresetApi['response'];
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

export async function createPreset(
  request: ApiTypes.CreatePresetApi['request'],
): Promise<ApiTypes.CreatePresetApi['response']> {
  return makeFetch(`${BASE_URL}/api/v1/preset`, {
    method: 'POST',
    body: request.body,
  }).then(res => res.json());
}

export async function updatePreset(
  request: ApiTypes.UpdatePresetApi['request'],
): Promise<ApiTypes.UpdatePresetApi['response']> {
  return makeFetch(`${BASE_URL}/api/v1/preset/${request.params?.id}`, {
    method: 'PUT',
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
