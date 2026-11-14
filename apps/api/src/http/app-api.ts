import AutoLoad from '@fastify/autoload';
import {join} from 'node:path';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';
import type {FastifyPluginAsync} from 'fastify';
import {presetRoutes} from '../modules/preset/index.js';
import {resolveSession} from '../modules/identity/index.js';
import {CommonErrors} from '../shared/errors.js';
import {anonymous} from '../shared/principal.js';

const appApi: FastifyPluginAsync = async fastify => {
  await fastify.register(fastifySwagger, {
    openapi: {
      info: {
        title: 'CodeImage app API',
        description:
          'First-party API for apps/codeimage. No stability promise to third parties.',
        version: 'v1',
      },
      components: {
        securitySchemes: {
          bearerAuth: {type: 'http', scheme: 'bearer', bearerFormat: 'JWT'},
        },
      },
    },
  });
  await fastify.register(fastifySwaggerUi, {
    routePrefix: '/api-docs',
    uiConfig: {docExpansion: 'list', deepLinking: true},
  });
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
        request.principal = await api.commandBus.execute(
          resolveSession(claims),
        );
      });

      api.addHook('onRoute', route => {
        route.schema = {
          ...route.schema,
          security:
            (route.config?.auth ?? 'required') === 'optional'
              ? [{}, {bearerAuth: []}]
              : [{bearerAuth: []}],
          response: {
            ...(typeof route.schema?.response === 'object'
              ? route.schema.response
              : {}),
            '4xx': {$ref: 'ErrorEnvelope#'},
            '5xx': {$ref: 'ErrorEnvelope#'},
          },
        };
      });
      await api.register(presetRoutes, {prefix: '/preset'});
      await api.register(AutoLoad, {
        dir: join(import.meta.dirname, '../routes/v1/project'),
        options: {prefix: '/project'},
        forceESM: true,
        ignorePattern: /\.d\.[cm]?ts$/,
      });
    },
    {prefix: '/api/v1'},
  );
};

export default appApi;
