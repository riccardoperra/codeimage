import {FastifyAuth0VerifyOptions} from 'fastify-auth0-verify';
import fp from 'fastify-plugin';

export default fp<FastifyAuth0VerifyOptions>(async fastify => {
  await fastify.register(import('fastify-auth0-verify'), {
    domain: process.env.DOMAIN_AUTH0,
    secret: process.env.CLIENT_SECRET_AUTH,
    audience: process.env.AUDIENCE_AUTH0,
  });

  await fastify.addHook('onRequest', async (request, reply) => {
    try {
      await request.jwtVerify();
    } catch (err) {
      reply.send(err);
    }
  });
});
