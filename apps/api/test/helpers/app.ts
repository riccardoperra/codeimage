import Fastify, {type FastifyInstance} from 'fastify';
import fp from 'fastify-plugin';
import type {TestContext} from 'vitest';
import App, {type AppOptions, options as serverOptions} from '../../src/app.js';
import {mockAuthProvider} from '../../src/plugins/auth0.js';
import {auth0Mock} from './auth0Mock.js';

export async function build(
  t: TestContext,
  {as, ...options}: AppOptions & {as?: {email: string} | null} = {},
) {
  const app = Fastify({...serverOptions, logger: false});
  t.onTestFinished(() => app.close());
  await app.register(fp(App), {
    authProvider:
      as === null
        ? fp(async (app: FastifyInstance) => {
            app.decorate('authenticate', async () => {
              throw new Error('no session');
            });
          })
        : as
          ? mockAuthProvider(as)
          : auth0Mock(t),
    ...options,
  });
  await app.ready();
  return app;
}
