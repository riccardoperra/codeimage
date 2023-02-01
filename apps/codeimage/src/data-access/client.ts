import {getAuth0State} from '@codeimage/store/auth/auth0';

export interface RequestParams {
  body?: unknown;
  querystring?: Record<string, string | number | boolean | symbol>;
  params?: Record<string, any>;
  headers?: Record<string, string | null | undefined>;
}

export interface Schema {
  request: any;
  response: any;
}

export async function makeFetch(
  input: RequestInfo,
  requestParams: Omit<RequestInit, keyof RequestParams> & RequestParams,
): Promise<Response> {
  const {getToken, forceLogin, loggedIn} = getAuth0State();

  let url = typeof input === 'string' ? input : input.url;
  const headers = new Headers();
  const request: RequestInit = {...(requestParams as RequestInit)};

  if (loggedIn()) {
    try {
      const token = await getToken();
      if (token) {
        headers.append('Authorization', `Bearer ${token}`);
      }
    } catch (e) {
      forceLogin();
      console.log(e);
    }
  }

  if (requestParams.querystring) {
    const querystring = new URLSearchParams();
    for (const [key, value] of Object.entries(requestParams.querystring)) {
      querystring.set(key, String(value));
    }
    url += `?${querystring.toString()}`;
  }

  if (requestParams.body) {
    request.body = JSON.stringify(requestParams.body);
    if (typeof requestParams.body === 'object') {
      headers.set('Content-Type', 'application/json');
    }
  }

  if (requestParams.headers) {
    for (const [key, value] of Object.entries(requestParams.headers)) {
      if (value) {
        headers.append(key, value);
      }
    }
  }

  if (requestParams.params) {
    for (const [key, value] of Object.entries(requestParams.params)) {
      url = url.replace(`:${key}`, value);
    }
  }

  request.headers = headers;

  return fetch(url, request).then(async res => {
    if (!res.ok) {
      return res.json().then(error => {
        return Promise.reject(error);
      });
    }
    return res;
  });
}
