import '@fastify/jwt';
import type {
  FastifyInstance,
  FastifyPluginAsync,
  FastifyReply,
  FastifyRequest,
} from 'fastify';
import type {Authenticate} from 'fastify-auth0-verify';
import fastifyAuth0Verify from 'fastify-auth0-verify';
import fp from 'fastify-plugin';
import type {SessionClaims} from '../shared/principal.js';

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: {id: number};
    user: Record<string, unknown>;
  }
}

declare module 'fastify' {
  interface FastifyInstance {
    verifySession(
      request: FastifyRequest,
      reply: FastifyReply,
    ): Promise<SessionClaims | null>;
  }
}

export function mockAuthProvider(context: {email: string}) {
  return fp(async (fastify: FastifyInstance) => {
    const authenticate: Authenticate = async req => {
      req.user = {
        [`${fastify.config.AUTH0_CLIENT_CLAIMS}/email`]: context.email,
      };
    };
    fastify.decorateRequest('user', null!);
    fastify.decorate('authenticate', authenticate);
  });
}

export interface AuthPluginOptions {
  readonly authProvider?: FastifyPluginAsync;
}

export default fp<AuthPluginOptions>(
  async (fastify, options) => {
    if (fastify.config.MOCK_AUTH) {
      await fastify.register(
        mockAuthProvider({email: fastify.config.MOCK_AUTH_EMAIL ?? ''}),
      );
    } else if (options.authProvider) {
      await fastify.register(options.authProvider);
    } else {
      await fastify.register(fastifyAuth0Verify.default, {
        domain: fastify.config.DOMAIN_AUTH0,
        secret: fastify.config.CLIENT_SECRET_AUTH,
        audience: fastify.config.AUDIENCE_AUTH0,
      });
    }
    fastify.decorateRequest('principal', null!);

    const emailClaim = `${fastify.config.AUTH0_CLIENT_CLAIMS}/email`;
    fastify.decorate(
      'verifySession',
      async (request: FastifyRequest, reply: FastifyReply) => {
        try {
          await fastify.authenticate(request, reply);
        } catch {
          return null;
        }
        if (!request.user) return null;
        const email = request.user[emailClaim];
        return {
          email: typeof email === 'string' && email !== '' ? email : null,
        };
      },
    );
  },
  {name: 'auth', dependencies: ['config']},
);
