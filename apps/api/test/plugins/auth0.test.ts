import {User} from '@codeimage/prisma-models';
import fastifyEnv from '@fastify/env';
import {Type} from '@sinclair/typebox';
import Fastify from 'fastify';
import fp from 'fastify-plugin';
import * as sinon from 'sinon';
import t from 'tap';
import auth0 from '../../src/plugins/auth0';
import prisma from '../../src/plugins/prisma';
import sensible from '../../src/plugins/sensible';

interface AppOptions {
  mockAuth: boolean;
}

process.env.AUTH0_CLIENT_CLAIMS = 'claims';
process.env.CLIENT_SECRET_AUTH = 'secret';
process.env.DOMAIN_AUTH0 = 'domain';
process.env.AUDIENCE_AUTH0 = 'audience';

async function build(t: Tap.Test, options: AppOptions = {mockAuth: false}) {
  if (options.mockAuth) {
    process.env.MOCK_AUTH = 'true';
    process.env.MOCK_AUTH_EMAIL = 'dev@example.it';
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
  await app.ready();
  t.teardown(() => void app.close());
  return app;
}

t.test('should throw unauthorized if token is not valid', async t => {
  const app = await build(t);
  sinon
    .stub(app, 'authenticate')
    .callsFake(() => Promise.reject(new Error('Error')));

  const response = await app.inject({
    method: 'GET',
    url: '/',
  });

  t.same(response.statusCode, 401);
  t.same(response.json().statusCode, 401);
});

t.test(
  'should not throw unauthorized if token is not present and mustBeAuthenticated = false',
  async t => {
    const app = await build(t);
    sinon
      .stub(app, 'authenticate')
      .callsFake(() => Promise.reject(new Error('Error')));

    const response = await app.inject({
      method: 'GET',
      url: '/optional',
    });

    t.same(response.statusCode, 200);
    t.same(response.json().response, 'ok');
    t.same(response.json().appUser, null);
  },
);

t.test('should decorate `appUser` if present', async t => {
  const app = await build(t);
  const storedUser = {
    email: 'storeduser@example.it',
    id: 'a5e403ce-1a94-4ba5-9e5c-9fe75bb2fe18',
    createdAt: new Date(),
  };

  sinon.stub(app, 'authenticate').callsFake(async req => {
    req.user = {
      [`${process.env.AUTH0_CLIENT_CLAIMS}/email`]: 'storeduser@example.it',
    };
  });

  // TODO: FIX THIS MAGIC TEST

  const createSpy = sinon.stub(app.prisma.user, 'create');
  sinon.stub(app.prisma.user, 'findFirst').resolves(storedUser);

  const response = await app.inject({
    method: 'GET',
    url: '/',
  });

  const resObj = response.json<{response: string; appUser: User | null}>();

  t.same(resObj.response, 'ok');
  t.ok(createSpy.notCalled);
  t.strictSame(resObj.appUser?.email, 'storeduser@example.it');
});

t.test('should also sync user in db if not exists', async t => {
  const app = await build(t);
  const storedUser = {
    email: 'email@example.it',
    id: '1',
    createdAt: new Date(),
  };

  sinon.stub(app, 'authenticate').callsFake(async req => {
    req.user = {
      [`${process.env.AUTH0_CLIENT_CLAIMS}/email`]: 'email@example.it',
    };
  });

  sinon.stub(app.prisma.user, 'findFirst').resolves(null);

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const createSpy = sinon.stub(app.prisma.user, 'create').resolves(storedUser);

  const response = await app.inject({
    method: 'GET',
    url: '/',
  });

  const resObj = response.json<{response: string; appUser: User | null}>();

  // TODO: fix test
  // t.ok(createSpy.calledOnce);
  t.same(resObj.response, 'ok');
  t.same(resObj.appUser?.email, 'email@example.it');
});

t.test('should return bad user detail if user has no email', async t => {
  const app = await build(t);
  sinon.stub(app, 'authenticate').callsFake(async req => {
    req.user = {
      [`${process.env.AUTH0_CLIENT_CLAIMS}/email`]: null,
    };
  });

  const response = await app.inject({
    method: 'GET',
    url: '/',
  });

  t.same(response.statusCode, 400);
  t.same(response.json(), {
    statusCode: 400,
    message: 'No valid user data',
    error: 'Bad Request',
  });
});

t.test('should mock auth', async t => {
  const app = await build(t, {mockAuth: true});

  const response = await app.inject({
    method: 'GET',
    url: '/',
  });

  sinon.stub(app.prisma.user, 'findFirst').resolves({
    email: 'dev@example.it',
    id: 'id',
    createdAt: new Date(),
  });

  t.same(response.statusCode, 200);
  t.sameStrict(response.json().user, {'claims/email': 'dev@example.it'});
  t.same(response.json().appUser.email, 'dev@example.it');
});

t.test('should mock auth with env fallback', async t => {
  const app = await build(t, {mockAuth: true});

  const response = await app.inject({
    method: 'GET',
    url: '/',
  });

  sinon.stub(app.prisma.user, 'findFirst').resolves({
    email: 'dev@example.it',
    id: 'id',
    createdAt: new Date(),
  });

  t.same(response.statusCode, 200);
  t.sameStrict(response.json().user, {'claims/email': 'dev@example.it'});
  t.same(response.json().appUser.email, 'dev@example.it');
});
