import fastifyAuth from '@fastify/auth';
import {FastifyPluginAsync, preHandlerHookHandler} from 'fastify';
import {AuthorizeOptions} from './authorize.js';

export const multiAuthProviderPlugin: FastifyPluginAsync = async fastify => {
  fastify.register(fastifyAuth);

  const preHookHandler: (
    options?: AuthorizeOptions,
  ) => preHandlerHookHandler = (options = {mustBeAuthenticated: true}) =>
    function (request, reply, done) {
      return fastify
        .auth([
          fastify.verifyAuth0(options),
          fastify.verifyHankoPasskey(options),
        ])
        .apply(this, [request, reply, done]);
    };

  fastify.decorate('authorize', preHookHandler);
};

declare module 'fastify' {
  interface FastifyInstance {
    authorize: (options?: AuthorizeOptions) => preHandlerHookHandler;
  }
}
