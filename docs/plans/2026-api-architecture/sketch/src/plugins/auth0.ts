/**
 * Session credential verification, and nothing else.
 *
 * Kept from today (constraint 4): the three provider branches (MOCK_AUTH, the `authProvider` app
 * option used by tests, fastify-auth0-verify), `fastify.authenticate`, the `${AUTH0_CLIENT_CLAIMS}/email`
 * claim, and the exported `mockAuthProvider` that test/helpers/auth0Mock.ts imports.
 *
 * Moved out: `authorize`, `request.appUser`, `request.appUserOptional` and the user-row provisioning.
 * Provisioning belongs to the identity module (it owns the users table); the required/optional policy
 * belongs to http/app-api.ts (it owns auth for its routes).
 */
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
    /**
     * Verifies the bearer session. Resolves null when there is no valid session; never throws for a
     * missing or bad token. The caller (http/app-api.ts) decides whether null is a 401.
     */
    verifySession(
      request: FastifyRequest,
      reply: FastifyReply,
    ): Promise<SessionClaims | null>;
  }
}

/** Unchanged signature: test/helpers/auth0Mock.ts calls it with the seeded user. */
export function mockAuthProvider(context: {email: string}) {
  return fp(async (fastify: FastifyInstance) => {
    const authenticate: Authenticate = async req => {
      req.user = {[`${fastify.config.AUTH0_CLIENT_CLAIMS}/email`]: context.email};
    };
    fastify.decorateRequest('user', null!);
    fastify.decorate('authenticate', authenticate);
  });
}

export interface AuthPluginOptions {
  /** Test seam: replaces fastify-auth0-verify. Passed through AppOptions, unchanged from today. */
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

    // Fastify 5 rejects object initial values for request decorators, so this uses today's `null!`
    // idiom (as for `appUser`). The API's onRequest hook assigns `request.principal` (at least
    // `anonymous`) before validation and handlers run.
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
        return {email: typeof email === 'string' && email !== '' ? email : null};
      },
    );
  },
  {name: 'auth', dependencies: ['config']},
);
