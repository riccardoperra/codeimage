import fastifyAuth from '@fastify/auth';
import {preHandlerHookHandler} from 'fastify';
import fp from 'fastify-plugin';

interface AuthorizeOptions {
  mustBeAuthenticated: boolean;
}
export default fp(async fastify => {
  fastify.register(fastifyAuth);

  const preHookHandler: (options: AuthorizeOptions) => preHandlerHookHandler = (
    options = {mustBeAuthenticated: true},
  ) =>
    function (request, reply, done) {
      return fastify
        .auth([
          fastify.verifyAuth0(options),
          fastify.verifyHankoPasskey(options),
        ])
        .apply(this, [request, reply, done]);
    };

  fastify.decorate('authorize', preHookHandler);
});

declare module 'fastify' {
  interface FastifyInstance {
    authorize: (options?: AuthorizeOptions) => preHandlerHookHandler;
  }
}
