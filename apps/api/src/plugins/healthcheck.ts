import * as fastifyHealthcheck from 'fastify-healthcheck';
import fp from 'fastify-plugin';

export default fp(async fastify => {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  return fastify.register(fastifyHealthcheck);
});
