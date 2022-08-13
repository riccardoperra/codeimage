import {User} from '@codeimage/prisma-models';
import {FastifyPluginAsync, FastifyReply, FastifyRequest} from 'fastify';
import fastifyAuth0Verify from 'fastify-auth0-verify';
import fp from 'fastify-plugin';

declare module '@fastify/jwt/jwt' {
  interface FastifyJWT {
    payload: {id: number}; // payload type is used for signing and verifying
    user: Record<string, unknown>;
  }
}

export default fp<{authProvider?: FastifyPluginAsync}>(
  async (fastify, options) => {
    if (options.authProvider) {
      await fastify.register(options.authProvider);
    } else {
      await fastify.register(fastifyAuth0Verify, {
        domain: process.env.DOMAIN_AUTH0,
        secret: process.env.CLIENT_SECRET_AUTH,
        audience: process.env.AUDIENCE_AUTH0,
      });
    }

    async function authorize(req: FastifyRequest, reply: FastifyReply) {
      try {
        await fastify.authenticate(req, reply);
      } catch (e) {
        throw fastify.httpErrors.unauthorized();
      }

      const emailClaim = `${process.env.AUTH0_CLIENT_CLAIMS}/email`;
      const email = req.user[emailClaim] as string;

      const user = await fastify.prisma.user.findFirst({
        where: {
          email,
        },
      });

      if (!user) {
        req.appUser = await fastify.prisma.user.create({
          data: {
            email,
          },
        });
      } else {
        req.appUser = user;
      }
    }

    fastify.decorateRequest('appUser', null);
    fastify.decorate('authorize', authorize);
  },
);

declare module 'fastify' {
  interface FastifyInstance {
    authorize: (req: FastifyRequest) => string;
  }

  interface FastifyRequest {
    appUser: User;
  }
}
