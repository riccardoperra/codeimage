import fastifyEnv from '@fastify/env';
import {Type} from '@sinclair/typebox';
import Fastify from 'fastify';
import fp from 'fastify-plugin';
// import * as sinon from 'sinon';
import t from 'tap';
import authorization from '../../src/plugins/authorization';
import prisma from '../../src/plugins/prisma';

// TODO: test to remove

t.test('Authorization plugin', async t => {
  async function build() {
    const app = Fastify();
    await void app.register(
      fp(async app => {
        await app.register(fastifyEnv, {
          schema: Type.Object({DATABASE_URL: Type.String()}),
        });
        await app.register(prisma);
        await app.register(authorization);
        await app.get('/', {preHandler: app.authorize}, async _ => ({
          response: 'ok',
        }));
      }),
    );
    await app.ready();
    t.teardown(() => void app.close());
    return app;
  }

  const app = await build();
  const userId = '006f434f-9946-4357-838f-b10280dfd7b7';

  await t.test('should return user if present', async () => {
    // const findFirstStub = sinon.stub(app.prisma.user, 'findFirst').returns({
    //   id: userId,
    //   provider: 'github',
    //   createdAt: new Date().toString(),
    // } as any);
    //
    // const spy = sinon.stub(app.prisma.user, 'create');

    const response = await app.inject({
      method: 'GET',
      url: '/',
      headers: {
        'user-id': userId,
      },
    });

    t.same(response.json<{response: string}>().response, 'ok');
    // t.ok(findFirstStub.calledOnce);
    // t.ok(spy.called);
  });

  await t.test('should sync user if not present', async () => {
    // const findFirstStub = sinon
    //   .stub(app.prisma.user, 'findFirst')
    //   .returns(Promise.resolve(null) as any);
    //
    // const spy = sinon.stub(app.prisma.user, 'create');

    const response = await app.inject({
      method: 'GET',
      url: '/',
      headers: {
        'user-id': userId,
      },
    });

    t.same(response.json<{response: string}>().response, 'ok');

    // t.ok(findFirstStub.calledOnce);
    // t.ok(spy.calledOnce);
  });
});
