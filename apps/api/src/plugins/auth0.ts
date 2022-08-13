import {User} from '@codeimage/prisma-models';
import {FastifyReply, FastifyRequest} from 'fastify';
import fp from 'fastify-plugin';

declare module '@fastify/jwt/jwt' {
  interface FastifyJWT {
    payload: {id: number}; // payload type is used for signing and verifying
    user: Record<string, unknown>;
  }
}

export default fp(async fastify => {
  await fastify.register(import('fastify-auth0-verify'), {
    domain: process.env.DOMAIN_AUTH0,
    secret: process.env.CLIENT_SECRET_AUTH,
    audience: process.env.AUDIENCE_AUTH0,
  });

  async function authorize(req: FastifyRequest, reply: FastifyReply) {
    await fastify.authenticate(req, reply);

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
});

declare module 'fastify' {
  interface FastifyInstance {
    authorize: (req: FastifyRequest) => string;
  }

  interface FastifyRequest {
    appUser: User;
  }
}
