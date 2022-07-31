import AutoLoad, {AutoloadPluginOptions} from '@fastify/autoload';
import {FastifyPluginAsync} from 'fastify';
import {join} from 'path';

export type AppOptions = {
  // Place your custom options for app below here.
} & Partial<AutoloadPluginOptions>;

const app: FastifyPluginAsync<AppOptions> = async (
  fastify,
  opts,
): Promise<void> => {
  // Do not touch the following lines

  // This loads all plugins defined in plugins
  // those should be support plugins that are reused
  // through your application
  void fastify.register(AutoLoad, {
    dir: join(__dirname, 'plugins'),
    options: opts,
  });

  void fastify.register(AutoLoad, {
    dir: join(__dirname, 'modules'),
    options: opts,
    maxDepth: 1,
  });

  // This loads all plugins defined in routes
  // define your routes in one of these
  void fastify.register(AutoLoad, {
    dir: join(__dirname, 'routes'),
    options: opts,
  });

  fastify.ready(() => fastify.log.info(`\n${fastify.printRoutes()}`));
};

export default app;
export {app};
