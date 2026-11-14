import Fastify from 'fastify';
import fp from 'fastify-plugin';
import type {TestContext} from 'vitest';
import App, {type AppOptions} from '../src/app.js';
import {auth0Mock} from './helpers/auth0Mock.js';

export async function build(t: TestContext, options: AppOptions = {}) {
  const app = Fastify();
  t.onTestFinished(() => app.close());
  await app.register(fp(App), {authProvider: auth0Mock(t), ...options});
  await app.ready();
  return app;
}
