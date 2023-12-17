import AutoLoad, {AutoloadPluginOptions} from '@fastify/autoload';
import fastifyEnv from '@fastify/env';
import {Type} from '@sinclair/typebox';
import {FastifyPluginAsync} from 'fastify';
import path, {join} from 'node:path';
import {fileURLToPath} from 'node:url';

declare module 'fastify' {
  interface FastifyInstance {
    config: {
      DATABASE_URL: string;
      MOCK_AUTH: boolean;
      MOCK_AUTH_EMAIL?: string;
      CLIENT_ID_AUTH0?: string;
      CLIENT_SECRET_AUTH0?: string;
      DOMAIN_AUTH0?: string;
      AUTH0_CLIENT_CLAIMS?: string;
      AUDIENCE_AUTH0?: string;
      CLIENT_SECRET_AUTH?: string;
      GRANT_TYPE_AUTH0?: string;
      ALLOWED_ORIGINS?: string;
      PRESETS_LIMIT?: number;
      HANKO_PASSKEYS_LOGIN_BASE_URL: string;
      HANKO_PASSKEYS_TENANT_ID: string;
      HANKO_PASSKEYS_API_KEY: string;
    };
  }
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export type AppOptions = {
  authProvider: FastifyPluginAsync;
  // Place your custom options for app below here.
} & Partial<AutoloadPluginOptions>;

const app: FastifyPluginAsync<AppOptions> = async (
  fastify,
  opts,
): Promise<void> => {
  // Do not touch the following lines

  await fastify.register(fastifyEnv, {
    dotenv: true,
    schema: Type.Object({
      DATABASE_URL: Type.String(),
      MOCK_AUTH: Type.Boolean(),
      CLIENT_ID_AUTH0: Type.String(),
      CLIENT_SECRET_AUTH0: Type.String(),
      DOMAIN_AUTH0: Type.String(),
      AUTH0_CLIENT_CLAIMS: Type.RegEx(/^https?:/),
      AUDIENCE_AUTH0: Type.RegEx(/^https?:/),
      GRANT_TYPE_AUTH0: Type.String(),
      ALLOWED_ORIGINS: Type.String(),
      PRESETS_LIMIT: Type.Number({default: Number.MAX_SAFE_INTEGER}),
      HANKO_PASSKEYS_LOGIN_BASE_URL: Type.String(),
      HANKO_PASSKEYS_TENANT_ID: Type.String(),
      HANKO_PASSKEYS_API_KEY: Type.String(),
    }),
  });

  // This loads all plugins defined in plugins
  // those should be support plugins that are reused
  // through your application
  await fastify.register(AutoLoad, {
    dir: join(__dirname, 'plugins'),
    options: opts,
    forceESM: true,
    encapsulate: false,
  });

  // This loads all plugins defined in routes
  // define your routes in one of these
  await fastify.register(AutoLoad, {
    dir: join(__dirname, 'routes'),
    options: {prefix: '/api/'},
    routeParams: true,
    forceESM: true,
  });

  await fastify.register(AutoLoad, {
    dir: join(__dirname, 'modules'),
    options: opts,
    encapsulate: false,
    maxDepth: 1,
    forceESM: true,
  });

  fastify.ready(() => fastify.log.info(fastify.printRoutes()));
};

export default app;
export {app};
