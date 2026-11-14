import Fastify, {type FastifyInstance} from 'fastify';
import fp from 'fastify-plugin';
import {type TestContext, expect, test} from 'vitest';
import config from '../../src/config.js';
import auth0, {mockAuthProvider} from '../../src/plugins/auth0.js';

async function build(t: TestContext, mock = false, email = 'user@example.it') {
  const app = Fastify();
  t.onTestFinished(() => app.close());
  await app.register(config, {
    overrides: {MOCK_AUTH: mock, MOCK_AUTH_EMAIL: 'dev@example.it'},
  });
  await app.register(auth0, {authProvider: mockAuthProvider({email})});
  app.get('/', async (req, reply) => ({
    claims: await app.verifySession(req, reply),
  }));
  await app.ready();
  return app;
}

test('the injected provider verifies namespaced email claims', async t => {
  const app = await build(t);
  expect((await app.inject('/')).json()).toEqual({
    claims: {email: 'user@example.it'},
  });
});

test('MOCK_AUTH uses MOCK_AUTH_EMAIL before the injected provider', async t => {
  const app = await build(t, true);
  expect((await app.inject('/')).json()).toEqual({
    claims: {email: 'dev@example.it'},
  });
});

test('a verified session without email retains an invalid claim', async t => {
  const app = await build(t, false, '');
  expect((await app.inject('/')).json()).toEqual({claims: {email: null}});
});

test('the real Auth0 provider treats a missing token as no session', async t => {
  const app = Fastify();
  t.onTestFinished(() => app.close());
  await app.register(config, {overrides: {MOCK_AUTH: false}});
  await app.register(auth0);
  app.get('/', async (req, reply) => ({
    claims: await app.verifySession(req, reply),
  }));
  expect((await app.inject('/')).json()).toEqual({claims: null});
});

test('a rejecting injected verifier returns no session', async t => {
  const app = Fastify();
  t.onTestFinished(() => app.close());
  await app.register(config, {overrides: {MOCK_AUTH: false}});
  await app.register(auth0, {
    authProvider: fp(async (server: FastifyInstance) => {
      server.decorate('authenticate', async () => {
        throw new Error('invalid token');
      });
    }),
  });
  app.get('/', async (req, reply) => ({
    claims: await app.verifySession(req, reply),
  }));
  expect((await app.inject('/')).json()).toEqual({claims: null});
});
