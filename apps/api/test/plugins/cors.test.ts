import fastifyEnv from '@fastify/env';
import {Type} from '@sinclair/typebox';
import Fastify from 'fastify';
import fp from 'fastify-plugin';
import * as sinon from 'sinon';
import t from 'tap';
import cors from '../../src/plugins/cors';

async function build(t: Tap.Test) {
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
  t.teardown(() => void app.close());
  return app;
}

t.beforeEach(() => sinon.restore());

t.test('should add cors origin *', async t => {
  process.env.ALLOWED_ORIGINS = '*';
  const app = await build(t);

  const response = await app.inject({
    method: 'GET',
    path: '/',
    headers: {
      origin: 'https://netflix.com',
    },
  });

  t.equal(response.headers['access-control-allow-origin'], '*');
});

t.test('should not add cors if empty', async t => {
  process.env.ALLOWED_ORIGINS = '';
  const app = await build(t);

  const response = await app.inject({
    method: 'GET',
    path: '/',
    headers: {
      origin: 'https://netflix.com',
    },
  });

  t.equal(response.headers['access-control-allow-origin'], undefined);
});

t.test('should add multiple cors origins', async t => {
  process.env.ALLOWED_ORIGINS = 'https://example.com,https://example-2.com';
  const app = await build(t);

  const responseNotValid = await app.inject({
    method: 'GET',
    path: '/',
    headers: {
      origin: 'https://netflix.com',
    },
  });

  t.equal(responseNotValid.headers['access-control-allow-origin'], undefined);

  const responseValid = await app.inject({
    method: 'GET',
    path: '/',
    headers: {
      origin: 'https://example.com',
    },
  });

  t.match(responseValid.headers, {
    'access-control-allow-origin': 'https://example.com',
    vary: 'Origin',
  });
});
