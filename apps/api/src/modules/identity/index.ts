import fp from 'fastify-plugin';
import {createUserRepository} from './identity.repository.js';
import {
  createIdentityService,
  type IdentityService,
} from './identity.service.js';

declare module 'fastify' {
  interface FastifyInstance {
    identity: IdentityService;
  }
}

export default fp(
  async fastify => {
    fastify.decorate(
      'identity',
      createIdentityService({users: createUserRepository(fastify.db)}),
    );
  },
  {name: 'identity', dependencies: ['db']},
);

export type {IdentityService} from './identity.service.js';
export type {User} from './identity.model.js';
