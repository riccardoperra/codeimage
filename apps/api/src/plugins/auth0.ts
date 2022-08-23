import {User} from '@codeimage/prisma-models';
import {
  FastifyInstance,
  FastifyPluginAsync,
  FastifyReply,
  FastifyRequest,
} from 'fastify';
import fastifyAuth0Verify, {Authenticate} from 'fastify-auth0-verify';
import fp from 'fastify-plugin';

declare module '@fastify/jwt/jwt' {
  interface FastifyJWT {
    payload: {id: number}; // payload type is used for signing and verifying
    user: Record<string, unknown>;
  }
}

interface AuthorizeOptions {
  mustBeAuthenticated: boolean;
}

export function mockAuthProvider(context: {email?: string} = {}) {
  const plugin: FastifyPluginAsync = async (fastify: FastifyInstance) => {
    const auth0Authenticate: Authenticate = async req => {
      console.log('is req');
      const email = context?.email ?? process.env.MOCK_AUTH_EMAIL;
      const clientClaim = process.env.AUTH0_CLIENT_CLAIMS ?? '';
      const emailKey = `${clientClaim}/email`;
      req.user = {
        [emailKey]: email,
      };
      console.log('CALL AUTHENTICATE', email, clientClaim, req.user);
    };

    fastify.decorateRequest('user', null);
    fastify.decorate('authenticate', auth0Authenticate);
  };

  return fp(plugin);
}

export default fp<{authProvider?: FastifyPluginAsync}>(
  async (fastify, options) => {
    console.log(fastify.config);
    if (fastify.config.MOCK_AUTH) {
      await fastify.register(
        mockAuthProvider({
          email: fastify.config.MOCK_AUTH_EMAIL,
        }),
      );
    } else if (options.authProvider) {
      await fastify.register(options.authProvider);
    } else {
      await fastify.register(fastifyAuth0Verify, {
        domain: process.env.DOMAIN_AUTH0,
        secret: process.env.CLIENT_SECRET_AUTH,
        audience: process.env.AUDIENCE_AUTH0,
      });
    }

    async function authorize(
      req: FastifyRequest,
      reply: FastifyReply,
      options: AuthorizeOptions = {
        mustBeAuthenticated: true,
      },
    ) {
      try {
        await fastify.authenticate(req, reply);
      } catch (e) {
        if (options.mustBeAuthenticated) {
          throw fastify.httpErrors.unauthorized();
        }
      }

      const emailClaim = `${process.env.AUTH0_CLIENT_CLAIMS ?? ''}/email`;

      if (!req.user) {
        req.appUserOptional = null;
        return;
      }

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

      req.appUserOptional = req.appUser;
    }

    fastify.decorateRequest('appUser', null);
    fastify.decorate('authorize', authorize);
  },
);

declare module 'fastify' {
  interface FastifyInstance {
    authorize: (
      req: FastifyRequest,
      reply: FastifyReply,
      options?: AuthorizeOptions,
    ) => void;
  }

  interface FastifyRequest {
    appUser: User;
    appUserOptional: User | null;
  }
}
