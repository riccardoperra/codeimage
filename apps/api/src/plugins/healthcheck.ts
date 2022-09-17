import * as fastifyHealthcheck from 'fastify-healthcheck';
import fp from 'fastify-plugin';

export default fp(async fastify => {
  // @ts-expect-error ???
  return fastify.register(fastifyHealthcheck);
});
