/**
 * NOT PART OF THE MIGRATION. An illustration of where the hosted public API plugs in when it ships.
 * Nothing in src/ imports this file.
 *
 * It is a second encapsulated plugin next to src/http/app-api.ts, registered by app.ts after the
 * modules. It differs from the app API only at the edge:
 * - prefix /public/v1, its own OpenAPI document, its own stability promise (additive within v1, a
 *   breaking change goes to /public/v2);
 * - its own credential: `Authorization: Bearer <api key>`, resolved to an Actor. Sessions are not
 *   accepted here;
 * - rate limiting per credential.
 * Services are the same ones the app API calls. They take an Actor and never see the credential.
 *
 * When this ships, shared/principal.ts Credential gains a second variant,
 *   {readonly type: 'api-key'; readonly keyId: string}
 * and the identity module gains `actorFromApiKey`. Until then both live here as local stand-ins, so
 * this file compiles against src/ unchanged.
 */
import fastifySwagger from '@fastify/swagger';
import type {FastifyPluginAsync, FastifyRequest} from 'fastify';
import {CommonErrors} from '../../src/shared/errors.js';
import type {Actor} from '../../src/shared/principal.js';
import presetPublicRoutes from '../modules/preset/preset.public.routes.js';

const publicApi: FastifyPluginAsync = async fastify => {
  // Its own document. Two @fastify/swagger instances in sibling contexts need checking when this lands.
  await fastify.register(fastifySwagger, {
    openapi: {
      info: {title: 'CodeImage public API', version: '1'},
      components: {securitySchemes: {apiKey: {type: 'http', scheme: 'bearer'}}},
    },
  });
  // TODO: serve the JSON document at /public/v1/openapi.json and snapshot-test it, so any change to a
  // public contract shows up as a reviewed diff.

  await fastify.register(
    async api => {
      api.addHook('onRequest', async request => {
        const token = bearerToken(request);
        const actor = token === null ? null : await actorFromApiKey(token);
        if (actor === null) throw CommonErrors.unauthenticated();
        request.principal = actor;
      });

      // @fastify/rate-limit registers here, after the credential hook:
      //   await api.register(rateLimit, {max, timeWindow, hook: 'preHandler',
      //     keyGenerator: request => <the api key id>, errorResponseBuilder: () => CommonErrors.rateLimited()});
      // `trustProxy` (app.ts options) makes request.ip the client address behind Railway.

      await api.register(presetPublicRoutes, {prefix: '/presets'});
    },
    {prefix: '/public/v1'},
  );
};

export default publicApi;

function bearerToken(request: FastifyRequest): string | null {
  const header = request.headers.authorization;
  return header?.startsWith('Bearer ') ? header.slice('Bearer '.length) : null;
}

/**
 * Stand-in for the identity module method. Resolves null for an unknown or revoked key. Key format,
 * hashing, storage, rotation and quotas are designed when the public API ships, inside identity.
 */
async function actorFromApiKey(token: string): Promise<Actor | null> {
  void token;
  throw new Error('not implemented');
}
