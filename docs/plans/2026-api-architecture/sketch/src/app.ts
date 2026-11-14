/**
 * Composition root. `fastify start` (Railway) loads this file's default export as the root plugin;
 * src/server.ts (dev, tsx) passes `options` to Fastify() and registers it by hand.
 *
 * Order is the dependency order, and it is visible here:
 *   1. config            everything reads fastify.config
 *   2. plugins/          infrastructure decorators (db, auth, errors, request-id, cors, health), autoloaded
 *   3. modules           each module's index.ts reads infrastructure once and decorates fastify.<module>
 *   4. http/app-api      registers module routes under /api/v1, behind the session auth hook
 * Routes therefore always register after the services they call.
 *
 * How dependencies reach use cases:
 *   plugins decorate infrastructure (fastify.db, fastify.config)
 *   → module index.ts reads them once and calls createXRepository(db) / createXService({...})
 *   → it decorates the returned service as fastify.<name>
 *   → a routes plugin reads fastify.<name> at registration; handlers call its methods with an Actor.
 * Use cases never see `fastify`, a request, or a decorator. No container, no bus.
 */
import AutoLoad from '@fastify/autoload';
import type {FastifyPluginAsync, FastifyServerOptions} from 'fastify';
import {join} from 'node:path';
import configPlugin, {type Config} from './config.js';
import appApi from './http/app-api.js';
import identity from './modules/identity/index.js';
import preset from './modules/preset/index.js';
import project from './modules/project/index.js';
import {genReqId} from './plugins/request-id.js';

export interface AppOptions {
  /** Test seam, unchanged (constraint 4): replaces fastify-auth0-verify. Read by plugins/auth0.ts. */
  readonly authProvider?: FastifyPluginAsync;
  /** Test seam: config values that win over env, e.g. `{PRESETS_LIMIT: 1}`. */
  readonly config?: Partial<Config>;
}

/**
 * Server options. server.ts passes them to Fastify(). fastify-cli applies an exported `options` object
 * only when started with the `--options` flag, so the `start:railway` script must pass it.
 */
export const options: FastifyServerOptions = {
  // A client-sent id is accepted only if it looks safe (plugins/request-id.ts). Fastify's own
  // requestIdHeader would trust any value, so it is off.
  requestIdHeader: false,
  genReqId,
  // Railway terminates TLS in front of us: request.ip must be the client for rate limiting and logs.
  trustProxy: true,
  logger: {redact: ['req.headers.authorization']},
};

const app: FastifyPluginAsync<AppOptions> = async (fastify, opts) => {
  await fastify.register(configPlugin, {overrides: opts.config});

  await fastify.register(AutoLoad, {
    dir: join(import.meta.dirname, 'plugins'),
    options: opts,
    forceESM: true,
  });

  // One line per module, in dependency order. test/architecture.test.ts fails when a folder under
  // src/modules/ is missing here.
  await fastify.register(identity);
  await fastify.register(project);
  await fastify.register(preset);

  await fastify.register(appApi);
};

export default app;
