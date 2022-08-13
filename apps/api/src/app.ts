import AutoLoad, {AutoloadPluginOptions} from '@fastify/autoload';
import fastifyEnv from '@fastify/env';
import {Type} from '@sinclair/typebox';
import {FastifyPluginAsync} from 'fastify';
import {join} from 'path';

declare module 'fastify' {
  interface FastifyInstance {
    config: {
      DATABASE_URL: string;
    };
  }
}

export type AppOptions = {
  authProvider: FastifyPluginAsync;
  // Place your custom options for app below here.
} & Partial<AutoloadPluginOptions>;

const app: FastifyPluginAsync<AppOptions> = async (
  fastify,
  opts,
): Promise<void> => {
  // Do not touch the following lines

  await fastify.register(fastifyEnv, {
    dotenv: true,
    schema: Type.Object({
      DATABASE_URL: Type.String(),
    }),
  });

  // This loads all plugins defined in plugins
  // those should be support plugins that are reused
  // through your application
  await fastify.register(AutoLoad, {
    dir: join(__dirname, 'plugins'),
    options: opts,
  });

  // This loads all plugins defined in routes
  // define your routes in one of these
  await fastify.register(AutoLoad, {
    dir: join(__dirname, 'routes'),
    options: {prefix: '/api/'},
    routeParams: true,
  });

  await fastify.register(AutoLoad, {
    dir: join(__dirname, 'modules'),
    options: opts,
    encapsulate: false,
    maxDepth: 1,
  });

  fastify.ready(() => fastify.log.info(`\n${fastify.printRoutes()}`));
};

export default app;
export {app};
