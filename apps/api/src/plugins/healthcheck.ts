import * as fastifyHealthcheck from 'fastify-healthcheck';
import fp from 'fastify-plugin';

export default fp(async fastify => {
  return fastify.register(fastifyHealthcheck);
});
