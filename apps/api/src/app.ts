import type {AutoloadPluginOptions} from '@fastify/autoload';
import AutoLoad from '@fastify/autoload';
import fp from 'fastify-plugin';
import identity from './modules/identity/index.js';
import project from './modules/project/index.js';
import preset from './modules/preset/index.js';
import appApi from './http/app-api.js';
import configPlugin, {type Config} from './config.js';
import type {FastifyServerOptions, FastifyPluginAsync} from 'fastify';
import {join} from 'node:path';

import {genReqId} from './plugins/request-id.js';

export const options: FastifyServerOptions = {
  requestIdHeader: false,
  genReqId,
  trustProxy: true,
  logger: {redact: ['req.headers.authorization']},
};

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
    ignorePattern: /\.d\.[cm]?ts$/,
  });

  await fastify.register(identity);
  await fastify.register(fp(project));
  await fastify.register(fp(preset));
  await fastify.register(appApi);
};
export default app;
export {app};
