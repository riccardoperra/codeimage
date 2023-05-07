import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';
import fp from 'fastify-plugin';
import {version} from '../../package.json';

export default fp(async fastify => {
  fastify.register(fastifySwagger, {
    swagger: {
      info: {
        title: 'CodeImage swagger',
        description: 'CodeImage API Swagger',
        version: version,
      },
      schemes: ['http', 'https'],
      consumes: ['application/json'],
      produces: ['application/json'],
    },
  });

  fastify.register(fastifySwaggerUi, {
    routePrefix: '/api-docs',
    uiConfig: {
      docExpansion: 'full',
      deepLinking: false,
    },
  });
});
