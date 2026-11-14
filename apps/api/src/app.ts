import AutoLoad from '@fastify/autoload';
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

export type AppOptions = {
  authProvider?: FastifyPluginAsync;
  config?: Partial<Config>;
};

const app: FastifyPluginAsync<AppOptions> = async (
  fastify,
  opts,
): Promise<void> => {
  await fastify.register(configPlugin, {overrides: opts.config});
  await fastify.register(AutoLoad, {
    dir: join(import.meta.dirname, 'plugins'),
    options: opts,
    forceESM: true,
    ignorePattern: /\.d\.[cm]?ts$/,
  });

  await fastify.register(identity);
  await fastify.register(project);
  await fastify.register(preset);
  await fastify.register(appApi);
};
export default app;
export {app};
