/**
 * The identity module. Wiring only: read infrastructure decorators once, call factories with explicit
 * arguments, decorate the service. Decorators stop here: the service never sees `fastify`.
 */
import fp from 'fastify-plugin';
import {createUserRepository} from './identity.repository.js';
import {createIdentityService, type IdentityService} from './identity.service.js';

declare module 'fastify' {
  interface FastifyInstance {
    /** Identity module interface. http/app-api.ts calls it to turn a verified session into an Actor. */
    identity: IdentityService;
  }
}

export default fp(
  async fastify => {
    fastify.decorate('identity', createIdentityService({users: createUserRepository(fastify.db)}));
  },
  {name: 'identity', dependencies: ['db']},
);

export type {IdentityService} from './identity.service.js';
export type {User} from './identity.model.js';
