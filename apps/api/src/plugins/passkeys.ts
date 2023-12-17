import {tenant} from '@teamhanko/passkeys-sdk';
import {preHandlerHookHandler} from 'fastify';
import fp from 'fastify-plugin';

interface AuthorizeOptions {
  mustBeAuthenticated: boolean;
}

export const passkeysPlugin = fp(async fastify => {
  const passkeysApi = tenant({
    tenantId: fastify.config.HANKO_PASSKEYS_TENANT_ID,
    apiKey: fastify.config.HANKO_PASSKEYS_API_KEY,
    baseUrl: fastify.config.HANKO_PASSKEYS_LOGIN_BASE_URL,
  });

  fastify.decorate('passkeysApi', passkeysApi);

  const verify: (options: AuthorizeOptions) => preHandlerHookHandler =
    (options = {mustBeAuthenticated: true}) =>
    async (req, reply, done) => {
      const token = req.headers.authorization
        ?.split('Bearer ')[1]
        .split('.')[1] as string;
      const claims = JSON.parse(atob(token));
      const userId = claims.sub;

      const user = await fastify.prisma.user.findFirst({
        where: {
          id: userId,
        },
      });

      if (user) {
        console.log('augment request with user', user);
        req.appUser = user;
        req.appUserOptional = user;
        done();
      } else if (options.mustBeAuthenticated) {
        throw fastify.httpErrors.unauthorized();
      }
    };

  fastify.decorate('verifyHankoPasskey', verify);
});

export default passkeysPlugin;

declare module 'fastify' {
  interface FastifyInstance {
    passkeysApi: ReturnType<typeof tenant>;

    verifyHankoPasskey: (
      options?: AuthorizeOptions,
    ) => (req: FastifyRequest, reply: FastifyReply) => void;
  }
}
