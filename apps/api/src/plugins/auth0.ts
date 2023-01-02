import {User} from '@codeimage/prisma-models';
import {
  FastifyInstance,
  FastifyPluginAsync,
  FastifyReply,
  FastifyRequest,
} from 'fastify';
import fastifyAuth0Verify, {Authenticate} from 'fastify-auth0-verify';
import fp from 'fastify-plugin';

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: {id: number}; // payload type is used for signing and verifying
    user: Record<string, unknown>; // user type is return type of `request.user` object
  }
}

interface AuthorizeOptions {
  mustBeAuthenticated: boolean;
}

export function mockAuthProvider(context: {email: string}) {
  return fp(async (fastify: FastifyInstance) => {
    const auth0Authenticate: Authenticate = async req => {
      const email = context.email;
      const clientClaim = fastify.config.AUTH0_CLIENT_CLAIMS;
      const emailKey = `${clientClaim}/email`;
      req.user = {
        [emailKey]: email,
      };
    };

    fastify.decorateRequest('user', null);
    fastify.decorate('authenticate', auth0Authenticate);
  });
}

export default fp<{authProvider?: FastifyPluginAsync}>(
  async (fastify, options) => {
    if (fastify.config.MOCK_AUTH) {
      await fastify.register(
        mockAuthProvider({
          email: fastify.config.MOCK_AUTH_EMAIL as string,
        }),
      );
    } else if (options.authProvider) {
      await fastify.register(options.authProvider);
    } else {
      await fastify.register(fastifyAuth0Verify, {
        domain: fastify.config.DOMAIN_AUTH0,
        secret: fastify.config.CLIENT_SECRET_AUTH,
        audience: fastify.config.AUDIENCE_AUTH0,
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

      const emailClaim = `${fastify.config.AUTH0_CLIENT_CLAIMS}/email`;

      if (!req.user) {
        req.appUserOptional = null;
        return;
      }

      const email = req.user[emailClaim] as string;

      if (!email) {
        throw fastify.httpErrors.badRequest('No valid user data');
      }

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
