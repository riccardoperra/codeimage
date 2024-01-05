import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';
import fp from 'fastify-plugin';

export default fp(async fastify => {
  fastify.register(fastifySwagger, {
    openapi: {
      info: {
        title: 'CodeImage API Documentation',
        description: 'CodeImage OpenAPI documentation',
        version: '1.0',
      },
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
      },
    },
  });

  fastify.register(fastifySwaggerUi, {
    routePrefix: '/api-docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: true,
    },
  });
});
