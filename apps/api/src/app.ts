import type {AutoloadPluginOptions} from '@fastify/autoload';
import AutoLoad from '@fastify/autoload';
import configPlugin, {type Config} from './config.js';
import type {FastifyPluginAsync} from 'fastify';
import {join} from 'node:path';

const __dirname = import.meta.dirname;

export type AppOptions = {
  authProvider?: FastifyPluginAsync;
  config?: Partial<Config>;
  // Place your custom options for app below here.
} & Partial<AutoloadPluginOptions>;

const app: FastifyPluginAsync<AppOptions> = async (
  fastify,
  opts,
): Promise<void> => {
  await fastify.register(configPlugin, {overrides: opts.config});

  // This loads all plugins defined in plugins
  // those should be support plugins that are reused
  // through your application
  await fastify.register(AutoLoad, {
    dir: join(__dirname, 'plugins'),
    options: opts,
    forceESM: true,
  });

  // This loads all plugins defined in routes
  // define your routes in one of these
  await fastify.register(AutoLoad, {
    dir: join(__dirname, 'routes'),
    options: {prefix: '/api/'},
    routeParams: true,
    forceESM: true,
  });

  await fastify.register(AutoLoad, {
    dir: join(__dirname, 'modules'),
    options: opts,
    encapsulate: false,
    maxDepth: 1,
    forceESM: true,
  });

  fastify.ready(() => fastify.log.info(fastify.printRoutes()));
};

export default app;
export {app};
