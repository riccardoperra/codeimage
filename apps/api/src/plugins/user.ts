import fp from 'fastify-plugin';

export default fp(async fastify => {
  fastify.decorateRequest('appUser', null);
  fastify.decorateRequest('appUserOptional', null);
});
