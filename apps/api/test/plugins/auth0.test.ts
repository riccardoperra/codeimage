import type {User} from '@codeimage/prisma-models';
import fastifyEnv from '@fastify/env';
import {Type} from '@sinclair/typebox';
import Fastify from 'fastify';
import fp from 'fastify-plugin';
import type {TestContext} from 'vitest';
import {assert, beforeEach, expect, test, vi} from 'vitest';
import auth0 from '../../src/plugins/auth0.js';
import prisma from '../../src/plugins/prisma.js';
import sensible from '../../src/plugins/sensible.js';

interface AppOptions {
  mockAuth: boolean;
}

vi.stubEnv('AUTH0_CLIENT_CLAIMS', 'claims');
vi.stubEnv('CLIENT_SECRET_AUTH', 'secret');
vi.stubEnv('DOMAIN_AUTH0', 'domain');
vi.stubEnv('AUDIENCE_AUTH0', 'audience');

beforeEach(() => vi.restoreAllMocks());

async function build(t: TestContext, options: AppOptions = {mockAuth: false}) {
  if (options.mockAuth) {
    vi.stubEnv('MOCK_AUTH', 'true');
    vi.stubEnv('MOCK_AUTH_EMAIL', 'dev@example.it');
  }

  const app = Fastify();
  await void app.register(
    fp(async app => {
      await app.register(fastifyEnv, {
        schema: Type.Object({
          DATABASE_URL: Type.String(),
          MOCK_AUTH: Type.Boolean(),
          MOCK_AUTH_EMAIL: Type.String(),
          AUTH0_CLIENT_CLAIMS: Type.String(),
          CLIENT_SECRET_AUTH: Type.String(),
          DOMAIN_AUTH0: Type.String(),
          AUDIENCE_AUTH0: Type.String(),
          ALLOWED_ORIGINS: Type.String(),
        }),
      });
      await app.register(sensible);
      await app.register(prisma);
      await app.register(auth0);

      app.get(
        '/',
        {preValidation: (req, reply) => app.authorize(req, reply)},
        async _ => ({
          response: 'ok',
          user: _.user,
          appUser: _.appUser,
        }),
      );

      app.get(
        '/optional',
        {
          preValidation: (req, reply) =>
            app.authorize(req, reply, {mustBeAuthenticated: false}),
        },
        async _ => ({
          response: 'ok',
          appUser: _.appUserOptional,
        }),
      );
    }),
  );
  try {
    await app.ready();
  } catch (e) {
    console.log(e);
  }
  return app;
}

test('should throw unauthorized if token is not valid', async t => {
  const app = await build(t);
  vi.spyOn(app, 'authenticate').mockRejectedValue(new Error('Error'));

  const response = await app.inject({
    method: 'GET',
    url: '/',
  });

  assert.equal(response.statusCode, 401);
  assert.equal(response.json().statusCode, 401);
});

test('should not throw unauthorized if token is not present and mustBeAuthenticated = false', async t => {
  const app = await build(t);
  vi.spyOn(app, 'authenticate').mockRejectedValue(new Error('Error'));

  const response = await app.inject({
    method: 'GET',
    url: '/optional',
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.json().response, 'ok');
  assert.equal(response.json().appUser, null);
});

test('should decorate `appUser` if present', async t => {
  const app = await build(t);
  const storedUser = {
    email: 'storeduser@example.it',
    id: 'a5e403ce-1a94-4ba5-9e5c-9fe75bb2fe18',
    createdAt: new Date(),
  };

  vi.spyOn(app, 'authenticate').mockImplementation(async req => {
    req.user = {
      [`${process.env.AUTH0_CLIENT_CLAIMS}/email`]: 'storeduser@example.it',
    };
  });

  // TODO: FIX THIS MAGIC TEST

  const createSpy = vi.spyOn(app.prisma.user, 'create');
  vi.spyOn(app.prisma.user, 'findFirst').mockResolvedValue(storedUser);

  const response = await app.inject({
    method: 'GET',
    url: '/',
  });

  const resObj = response.json<{response: string; appUser: User | null}>();

  assert.equal(resObj.response, 'ok');
  expect(createSpy).not.toHaveBeenCalled();
  assert.strictEqual(resObj.appUser?.email, 'storeduser@example.it');
});

test('should also sync user in db if not exists', async t => {
  const app = await build(t);
  const storedUser = {
    email: 'email@example.it',
    id: '1',
    createdAt: new Date(),
  };

  vi.spyOn(app, 'authenticate').mockImplementation(async req => {
    req.user = {
      [`${process.env.AUTH0_CLIENT_CLAIMS}/email`]: 'email@example.it',
    };
  });

  vi.spyOn(app.prisma.user, 'findFirst').mockResolvedValue(null);

  const createSpy = vi
    .spyOn(app.prisma.user, 'create')
    .mockResolvedValue(storedUser);

  const response = await app.inject({
    method: 'GET',
    url: '/',
  });

  const resObj = response.json<{response: string; appUser: User | null}>();

  // TODO: fix test
  // expect(createSpy).toHaveBeenCalledTimes(1);
  assert.equal(resObj.response, 'ok');
  expect(createSpy).toHaveBeenCalledTimes(1);
  assert.equal(resObj.appUser?.email, 'email@example.it');
});

test('should return bad user detail if user has no email', async t => {
  const app = await build(t);
  vi.spyOn(app, 'authenticate').mockImplementation(async req => {
    req.user = {
      [`${process.env.AUTH0_CLIENT_CLAIMS}/email`]: null,
    };
  });

  const response = await app.inject({
    method: 'GET',
    url: '/',
  });

  assert.equal(response.statusCode, 400);
  assert.deepStrictEqual(response.json(), {
    statusCode: 400,
    message: 'No valid user data',
    error: 'Bad Request',
  });
});

test('should mock auth', async t => {
  const app = await build(t, {mockAuth: true});

  vi.spyOn(app.prisma.user, 'findFirst').mockResolvedValue({
    email: 'dev@example.it',
    id: 'id',
    createdAt: new Date(),
  });

  const response = await app.inject({
    method: 'GET',
    url: '/',
  });

  assert.equal(response.statusCode, 200);
  assert.deepStrictEqual(response.json().user, {
    'claims/email': 'dev@example.it',
  });
  assert.strictEqual(response.json().appUser.email, 'dev@example.it');
});

test('should mock auth with env fallback', async t => {
  const app = await build(t, {mockAuth: true});

  vi.spyOn(app.prisma.user, 'findFirst').mockResolvedValue({
    email: 'dev@example.it',
    id: 'id',
    createdAt: new Date(),
  });

  const response = await app.inject({
    method: 'GET',
    url: '/',
  });

  assert.equal(response.statusCode, 200);
  assert.deepStrictEqual(response.json().user, {
    'claims/email': 'dev@example.it',
  });
  assert.strictEqual(response.json().appUser.email, 'dev@example.it');
});
