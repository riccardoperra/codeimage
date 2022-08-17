import createAuth0Client from '@auth0/auth0-spa-js';

const env = import.meta.env;

export const auth0 = createAuth0Client({
  domain: env.VITE_PUBLIC_AUTH0_DOMAIN,
  client_id: env.VITE_PUBLIC_AUTH0_CLIENT_ID,
  redirect_uri: `${window.location.protocol}/${window.location.host}`,
  audience: env.VITE_PUBLIC_AUTH0_AUDIENCE,
});
