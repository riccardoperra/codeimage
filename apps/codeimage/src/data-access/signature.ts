import type * as ApiTypes from '@codeimage/api/api-types';
import {makeFetch} from './client';

const env = import.meta.env;
const BASE_URL = env.VITE_API_BASE_URL ?? '';

export async function deleteSignature(
  request: ApiTypes.DeleteSignatureApi['request'],
): Promise<ApiTypes.DeleteSignatureApi['response']> {
  return makeFetch(`${BASE_URL}/api/v1/signature/:id`, {
    method: 'DELETE',
    params: {
      id: request.params?.id,
    },
  }).then(res => res.json());
}

export async function createSignature(
  request: ApiTypes.CreateSignatureApi['request'],
): Promise<ApiTypes.CreateSignatureApi['response']> {
  return makeFetch(`${BASE_URL}/api/v1/signature`, {
    method: 'POST',
    body: request.body,
  }).then(res => {
    if (!res.ok) throw new Error(`Signature not saved: ${res.status}`);
    return res.json();
  });
}

export async function updateSignature(
  request: ApiTypes.UpdateSignatureApi['request'],
): Promise<ApiTypes.UpdateSignatureApi['response']> {
  return makeFetch(`${BASE_URL}/api/v1/signature/${request.params?.id}`, {
    method: 'PUT',
    body: request.body,
  }).then(res => {
    if (!res.ok) throw new Error(`Signature not updated: ${res.status}`);
    return res.json();
  });
}

export async function getAllSignatures(
  request: ApiTypes.GetAllSignatureApi['request'],
): Promise<ApiTypes.GetAllSignatureApi['response']> {
  return makeFetch(`${BASE_URL}/api/v1/signature`, {
    method: 'GET',
    body: request.body,
  }).then(res => res.json());
}
