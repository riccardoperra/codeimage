import * as sinon from 'sinon';
import t from 'tap';

import {build} from '../../../helper';
import {getSeeder} from '../../../helpers/seed';

const {cleanSeed, setupSeedBefore} = getSeeder();

setupSeedBefore(async client => {
  const user = await client.user.create({
    data: {id: 'd8f4fe3f-199f-4a97-8f08-10b21c8e7cdd', provider: 'test'},
  });
  await client.project.create({
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
      user: {connect: {id: user.id}},
    },
  });
});

t.test('PUT /v1/project/:id/name [Update Name] -> 200', async t => {
  const fastify = await build(t);
  const userId = 'd8f4fe3f-199f-4a97-8f08-10b21c8e7cdd';
  const newName = 'newName';
  const projectId = 'a7a1cb1d-2e4c-4f2f-8801-f73adddd8a6d';
  const spy = sinon.spy(fastify.projectService, 'updateName');

  const response = await fastify.inject({
    url: `/api/v1/project/${projectId}/name`,
    method: 'PUT',
    payload: {name: newName},
    headers: {
      'user-id': userId,
    },
  });

  t.ok(
    spy.withArgs(userId, projectId, 'newName').calledOnce,
    'has been called once',
  );
  t.same(response.statusCode, 200, 'return status 200');
  t.equal(JSON.parse(response.body).name, newName, 'return updated name');
});

cleanSeed();
