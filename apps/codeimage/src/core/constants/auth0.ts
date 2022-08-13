import createAuth0Client from '@auth0/auth0-spa-js';

const env = import.meta.env;

export const auth0 = createAuth0Client({
  domain: env.VITE_PUBLIC_AUTH0_DOMAIN,
  client_id: env.VITE_PUBLIC_AUTH0_CLIENT_ID,
  redirect_uri: env.VITE_PUBLIC_MY_CALLBACK_URL,
  audience: env.VITE_PUBLIC_AUTH0_AUDIENCE,
});
