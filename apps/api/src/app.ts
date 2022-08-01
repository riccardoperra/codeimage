import AutoLoad, {AutoloadPluginOptions} from '@fastify/autoload';
import {TypeBoxTypeProvider} from '@fastify/type-provider-typebox';
import {FastifyPluginAsync} from 'fastify';
import fp from 'fastify-plugin';
import {join} from 'path';
import project from './modules/project';

export type AppOptions = {
  // Place your custom options for app below here.
} & Partial<AutoloadPluginOptions>;

const app: FastifyPluginAsync<AppOptions> = async (
  fastify,
  opts,
): Promise<void> => {
  Object.assign(fastify, fastify.withTypeProvider<TypeBoxTypeProvider>());
  // Do not touch the following lines

  // This loads all plugins defined in plugins
  // those should be support plugins that are reused
  // through your application
  await void fastify.register(AutoLoad, {
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

  await fastify.register(fp(project));

  fastify.ready(() => fastify.log.info(`\n${fastify.printRoutes()}`));
};

export default app;
export {app};
