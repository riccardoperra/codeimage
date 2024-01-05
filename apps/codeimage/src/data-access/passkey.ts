import type * as ApiTypes from '@codeimage/api/api-types';
import {makeFetch} from './client';

const env = import.meta.env;
const BASE_URL = env.VITE_API_BASE_URL ?? '';

export async function startPasskeyRegistration(): Promise<
  ApiTypes.PasskeyStartRegistrationApi['response']
> {
  return makeFetch(`${BASE_URL}/api/v1/passkey/registration`, {
    method: 'POST',
  }).then(res => res.json());
}

export async function finalizePasskeyRegistration(
  body: ApiTypes.PasskeyFinalizeRegistrationApi['request']['body'],
): Promise<ApiTypes.PasskeyFinalizeRegistrationApi['response']> {
  return makeFetch(`${BASE_URL}/api/v1/passkey/finalize-registration`, {
    method: 'POST',
    body,
  }).then(res => res.json());
}

export async function startPasskeyLogin(): Promise<
  ApiTypes.PasskeyStartLoginApi['response']
> {
  return makeFetch(
    `${BASE_URL}/api/v1/passkey/start-login`,
    {
      method: 'POST',
    },
    false,
  ).then(res => res.json());
}

export async function finalizePasskeyLogin(
  body: ApiTypes.PasskeyFinalizeLoginApi['request']['body'],
): Promise<ApiTypes.PasskeyFinalizeLoginApi['response']> {
  return makeFetch(
    `${BASE_URL}/api/v1/passkey/finalize-login`,
    {
      method: 'POST',
      body,
    },
    false,
  ).then(res => res.json());
}

export async function listPasskeys(): Promise<
  ApiTypes.PasskeyListCredentialsApi['response'][]
> {
  return makeFetch(`${BASE_URL}/api/v1/passkey/credentials`, {
    method: 'GET',
  }).then(res => res.json());
}

export async function deletePasskey(
  data: ApiTypes.DeleteCredentialApi['request'],
): Promise<ApiTypes.PasskeyStartLoginApi['response']> {
  return makeFetch(
    `${BASE_URL}/api/v1/passkey/credentials/:id`.replace(
      ':id',
      data.params!.credentialId,
    ),
    {
      method: 'DELETE',
    },
  ).then(res => res.json());
}
