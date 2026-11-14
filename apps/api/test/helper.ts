import Fastify from 'fastify';
import fp from 'fastify-plugin';
import type {TestContext} from 'vitest';
import App from '../src/app.js';
import {auth0Mock} from './helpers/auth0Mock.js';

export async function build(t: TestContext) {
  const app = Fastify();
  t.onTestFinished(() => app.close());
  await app.register(fp(App), {authProvider: auth0Mock(t)});
  await app.ready();
  return app;
}
