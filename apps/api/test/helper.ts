// This file contains code that we reuse between our tests.
import Fastify, {FastifyInstance} from 'fastify';
import fp from 'fastify-plugin';
import {TestContext} from 'vitest';
import App from '../src/app.js';
import {auth0Mock} from './helpers/auth0Mock.js';

// Fill in this config with all the configurations
// needed for testing the application
async function config(t: any) {
  return {
    authProvider: auth0Mock(t as any),
  };
}

// Automatically build and tear down our instance
async function build(t: TestContext) {
  const app = Fastify();

  // fastify-plugin ensures that all decorators
  // are exposed for testing purposes, this is
  // different from the production setup-job
  await app.register(fp(App), await config(t));

  await app.ready();
  return app;
}

export function withFastifyApp<T>(
  test: (context: TestContext & T, fastify: FastifyInstance) => Promise<void>,
  configFn: (a: any) => Promise<any> = config,
) {
  return async (context: TestContext & T) => {
    const app = await build(await configFn(context));
    await test(context, app);
    await app.close();
  };
}

export {config, build};
