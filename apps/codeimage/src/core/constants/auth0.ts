import type {Auth0Client} from '@auth0/auth0-spa-js';

const env = import.meta.env;

function createAuth0(): Promise<Auth0Client> {
  if (env.VITE_MOCK_AUTH) {
    return import('./auth0Mock').then(({createAuth0Client}) =>
      createAuth0Client(),
    );
  }
  return import('@auth0/auth0-spa-js').then(({default: createAuth0Client}) =>
    createAuth0Client({
      domain: env.VITE_PUBLIC_AUTH0_DOMAIN,
      client_id: env.VITE_PUBLIC_AUTH0_CLIENT_ID,
      redirect_uri: `${window.location.protocol}//${window.location.host}`,
      audience: env.VITE_PUBLIC_AUTH0_AUDIENCE,
      cacheLocation: 'localstorage',
    }),
  );
}

export const auth0 = createAuth0();
