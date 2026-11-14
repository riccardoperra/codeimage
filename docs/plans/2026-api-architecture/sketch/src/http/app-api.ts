/**
 * The first-party API used by apps/codeimage, at /api/v1.
 *
 * Owns, for every route it registers: the /api/v1 prefix, the Auth0 session resolved to
 * `request.principal` (honoring each operation's `config.auth`, default 'required'), the OpenAPI
 * document with Swagger UI at /api-docs, and the OpenAPI security and error blocks on each route.
 *
 * Stability promise: lockstep with apps/codeimage. A breaking change ships with the frontend change in
 * the same commit; the derived api-types make the frontend fail to compile otherwise. No promise to
 * third parties is made here.
 *
 * Encapsulated on purpose (not fastify-plugin): its hooks apply to its own routes only. app.ts registers
 * it after every module, so each `fastify.<module>` exists when the routes read it.
 */
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';
import type {FastifyPluginAsync} from 'fastify';
import {presetRoutes} from '../modules/preset/index.js';
import {projectRoutes} from '../modules/project/index.js';
import {CommonErrors} from '../shared/errors.js';
import {anonymous} from '../shared/principal.js';

const appApi: FastifyPluginAsync = async fastify => {
  // Registered in this context, so the document lists this API's routes only.
  await fastify.register(fastifySwagger, {
    openapi: {
      info: {
        title: 'CodeImage app API',
        description: 'First-party API for apps/codeimage. No stability promise to third parties.',
        version: 'v1',
      },
      components: {
        securitySchemes: {bearerAuth: {type: 'http', scheme: 'bearer', bearerFormat: 'JWT'}},
      },
    },
  });
  await fastify.register(fastifySwaggerUi, {
    routePrefix: '/api-docs',
    uiConfig: {docExpansion: 'list', deepLinking: true},
  });

  // Routes live one level down so the auth hook does not cover /api-docs.
  await fastify.register(
    async api => {
      api.addHook('onRequest', async (request, reply) => {
        const claims = await api.verifySession(request, reply);
        if (claims === null) {
          if ((request.routeOptions.config.auth ?? 'required') === 'required') {
            throw CommonErrors.unauthenticated();
          }
          request.principal = anonymous;
          return;
        }
        // Provisions the user row on first sight. A session without email is a 400 (today's behavior).
        request.principal = await api.identity.actorFromSession(claims);
      });

      api.addHook('onRoute', route => {
        // TODO: document what the hooks above enforce, so the OpenAPI document cannot drift from them:
        //   route.schema = {...route.schema,
        //     security: (route.config?.auth ?? 'required') === 'optional' ? [{}, {bearerAuth: []}] : [{bearerAuth: []}],
        //     response: {...route.schema?.response, '4xx': {$ref: 'ErrorEnvelope#'}, '5xx': {$ref: 'ErrorEnvelope#'}}};
        // ErrorEnvelope is added at the root by plugins/errors.ts.
        void route;
      });

      // One line per module with routes. test/architecture.test.ts fails when a module's routes are missing here.
      await api.register(projectRoutes, {prefix: '/project'});
      await api.register(presetRoutes, {prefix: '/preset'});
    },
    {prefix: '/api/v1'},
  );
};

export default appApi;
