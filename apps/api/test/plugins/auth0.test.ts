import {User} from '@codeimage/prisma-models';
import fastifyEnv from '@fastify/env';
import {Type} from '@sinclair/typebox';
import Fastify from 'fastify';
import * as sinon from 'sinon';
import t from 'tap';
import auth0 from '../../src/plugins/auth0';
import prisma from '../../src/plugins/prisma';
import sensible from '../../src/plugins/sensible';

async function build(t: Tap.Test) {
  const app = Fastify();
  await void app.register(
    fp(async app => {
      await app.register(fastifyEnv, {
        schema: Type.Object({DATABASE_URL: Type.String()}),
      });
      await app.register(sensible);
      await app.register(prisma);
      await app.register(auth0);
      await app.get('/', {preValidation: app.authorize}, async _ => ({
        response: 'ok',
        appUser: _.appUser,
      }));
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
