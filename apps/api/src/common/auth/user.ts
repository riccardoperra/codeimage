import {FastifyPluginAsync} from 'fastify';
import {User} from '@codeimage/prisma-models';

export const appUserPlugin: FastifyPluginAsync = async fastify => {
  fastify.decorateRequest('appUser', null);
};

declare module 'fastify' {
  interface FastifyRequest {
    appUser: User;
  }
}
