import {ManagementClient} from 'auth0';
import fp from 'fastify-plugin';

export default fp(async fastify => {
  fastify.decorate(
    'auth0Management',
    new ManagementClient({
      domain: fastify.config.DOMAIN_AUTH0!,
      audience: fastify.config.AUDIENCE_AUTH0!,
      clientId: fastify.config.CLIENT_ID_AUTH0!,
      clientSecret: fastify.config.CLIENT_SECRET_AUTH0!,
    }),
  );
});

declare module 'fastify' {
  interface FastifyInstance {
    auth0Management: ManagementClient;
  }
}
