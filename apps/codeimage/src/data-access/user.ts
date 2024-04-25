import {makeFetch} from './client';
import type * as ApiTypes from '@codeimage/api/api-types';

const env = import.meta.env;
const BASE_URL = env.VITE_API_BASE_URL ?? '';

export type UserInfoResponse = ApiTypes.UserInfoApi['response'];
export function getUserInfo(token: string): Promise<UserInfoResponse> {
  return makeFetch(`${BASE_URL}/api/v1/user/info`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }).then(response => response.json());
}
