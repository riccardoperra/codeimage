import AutoLoad from '@fastify/autoload';
import fp from 'fastify-plugin';
import {join} from 'node:path';
import {createUserRepository} from './identity.repository.js';

export default fp(
  async fastify => {
    await fastify.register(AutoLoad, {
      dir: join(import.meta.dirname, 'commands'),
      forceESM: true,
      ignorePattern: /\.d\.[cm]?ts$/,
      options: {users: createUserRepository(fastify.db)},
    });
  },
  {name: 'identity', dependencies: ['db', 'bus']},
);

export {resolveSession} from './commands/resolve-session.js';
