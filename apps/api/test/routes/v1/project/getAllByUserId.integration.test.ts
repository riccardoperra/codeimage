import * as sinon from 'sinon';
import t from 'tap';

import {build} from '../../../helper';
import {getSeeder} from '../../../helpers/seed';

const {cleanSeed, setupSeedBefore} = getSeeder();

setupSeedBefore(async client => {
  return client.$transaction([
    client.user.create({
      data: {id: 'd8f4fe3f-199f-4a97-8f08-10b21c8e7cdd', provider: 'test'},
    }),
    client.project.create({
      data: {
        name: 'name',
        id: 'a7a1cb1d-2e4c-4f2f-8801-f73adddd8a6d',
        frame: {create: {}},
        terminal: {create: {}},
        editorTabs: {
          createMany: {
            data: [{languageId: '1', code: 'code', tabName: 'index.tsx'}],
          },
        },
        editorOptions: {create: {}},
        user: {connect: {id: 'd8f4fe3f-199f-4a97-8f08-10b21c8e7cdd'}},
      },
    }),
  ]);
});

t.test('/v1/project -> 200', async t => {
  const fastify = await build(t);
  const userId = 'd8f4fe3f-199f-4a97-8f08-10b21c8e7cdd';
  const spy = sinon.spy(fastify.projectService, 'findAllByUserId');

  const response = await fastify.inject({
    url: '/api/v1/project',
    method: 'GET',
    headers: {
      'user-id': userId,
    },
  });

  const body = JSON.parse(response.body);

  t.ok(spy.withArgs(userId).calledOnce);
  t.equal(body.length, 1);
  t.same(body[0].id, 'a7a1cb1d-2e4c-4f2f-8801-f73adddd8a6d');
  t.same(body[0].userId, userId);
  t.same(response.statusCode, 200);
});

cleanSeed();
