import fastifyCors from '@fastify/cors';
import fp from 'fastify-plugin';

export default fp(async fastify => {
  const config = fastify.config.ALLOWED_ORIGINS;

  if (!config) {
    return;
  }

  const origins = config.split(',').map(str => str.trim());
  const origin = origins.includes('*') ? '*' : origins;

  fastify.register(fastifyCors, {origin});
});
