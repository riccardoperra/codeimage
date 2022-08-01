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

export function makeFetch(
  input: RequestInfo,
  requestParams: Omit<RequestInit, keyof RequestParams> & RequestParams,
): Promise<Response> {
  let url = typeof input === 'string' ? input : input.url;
  const headers = new Headers();
  const request: RequestInit = {...(requestParams as RequestInit)};

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

  return fetch(url, request);
}
