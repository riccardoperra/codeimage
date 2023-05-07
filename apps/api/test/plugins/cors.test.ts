import fastifyEnv from '@fastify/env';
import {Type} from '@sinclair/typebox';
import Fastify from 'fastify';
import fp from 'fastify-plugin';
import * as sinon from 'sinon';
import {afterAll, assert, beforeEach, expect, test, TestContext} from 'vitest';
import cors from '../../src/plugins/cors.js';

async function build(t: TestContext) {
  const app = Fastify();
  await void app.register(
    fp(async app => {
      await app.register(fastifyEnv, {
        schema: Type.Object({ALLOWED_ORIGINS: Type.String()}),
      });
      await app.register(cors);
    }),
  );
  app.get('/', async _ => ({
    response: 'ok',
  }));
  await app.ready();
  afterAll(() => app.close());
  return app;
}

beforeEach(() => sinon.restore());

test('should add cors origin *', async t => {
  process.env.ALLOWED_ORIGINS = '*';
  const app = await build(t);

  const response = await app.inject({
    method: 'GET',
    path: '/',
    headers: {
      origin: 'https://netflix.com',
    },
  });

  assert.equal(response.headers['access-control-allow-origin'], '*');
});

test('should not add cors if empty', async t => {
  process.env.ALLOWED_ORIGINS = '';
  const app = await build(t);

  const response = await app.inject({
    method: 'GET',
    path: '/',
    headers: {
      origin: 'https://netflix.com',
    },
  });

  assert.equal(response.headers['access-control-allow-origin'], undefined);
});

test('should add multiple cors origins', async t => {
  process.env.ALLOWED_ORIGINS = 'https://example.com,https://example-2.com';
  const app = await build(t);

  const responseNotValid = await app.inject({
    method: 'GET',
    path: '/',
    headers: {
      origin: 'https://netflix.com',
    },
  });

  assert.equal(
    responseNotValid.headers['access-control-allow-origin'],
    undefined,
  );

  const responseValid = await app.inject({
    method: 'GET',
    path: '/',
    headers: {
      origin: 'https://example.com',
    },
  });

  expect(responseValid.headers).toContain({
    'access-control-allow-origin': 'https://example.com',
    vary: 'Origin',
  });
});
