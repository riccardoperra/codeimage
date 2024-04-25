import fp from 'fastify-plugin';
import {auth0Plugin} from '../common/auth/auth0.js';
import {multiAuthProviderPlugin} from '../common/auth/multiAuth.js';
import passkeysPlugin from '../common/auth/passkeys.js';
import {appUserPlugin} from '../common/auth/user.js';

export default fp(
  async fastify => {
    fastify
      .register(fp(appUserPlugin))
      .register(fp(passkeysPlugin))
      .register(fp(auth0Plugin))
      .register(fp(multiAuthProviderPlugin));
  },
  {encapsulate: false},
);
