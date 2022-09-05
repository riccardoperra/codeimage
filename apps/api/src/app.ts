import AutoLoad, {AutoloadPluginOptions} from '@fastify/autoload';
import fastifyEnv from '@fastify/env';
import {Type} from '@sinclair/typebox';
import {FastifyPluginAsync} from 'fastify';
import {join} from 'path';

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
    };
  }
}

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
    }),
  });

  // This loads all plugins defined in plugins
  // those should be support plugins that are reused
  // through your application
  await fastify.register(AutoLoad, {
    dir: join(__dirname, 'plugins'),
    options: opts,
  });

  // This loads all plugins defined in routes
  // define your routes in one of these
  await fastify.register(AutoLoad, {
    dir: join(__dirname, 'routes'),
    options: {prefix: '/api/'},
    routeParams: true,
  });

  await fastify.register(AutoLoad, {
    dir: join(__dirname, 'modules'),
    options: opts,
    encapsulate: false,
    maxDepth: 1,
  });

  fastify.ready(() => fastify.log.info(`\n${fastify.printRoutes()}`));
};

export default app;
export {app};
