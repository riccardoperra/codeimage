import fastifySwagger from '@fastify/swagger';
import fp from 'fastify-plugin';

export default fp(async fastify => {
  fastify.register(fastifySwagger, {
    swagger: {
      info: {
        title: 'CodeImage swagger',
        description: 'Testing the Fastify swagger API',
        version: '0.1.0',
      },
      host: 'localhost:3000',
      schemes: ['http'],
      consumes: ['application/json'],
      produces: ['application/json'],
    },
  });
});
