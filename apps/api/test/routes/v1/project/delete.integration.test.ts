import * as sinon from 'sinon';
import t from 'tap';

import {build} from '../../../helper';
import {getSeeder} from '../../../helpers/seed';

const {cleanSeed, setupSeedBefore} = getSeeder();

const userId = 'd8f4fe3f-199f-4a97-8f08-10b21c8e7cdd';
const projectId = 'a7a1cb1d-2e4c-4f2f-8801-f73adddd8a6d';

setupSeedBefore(async client => {
  const user = await client.user.create({
    data: {id: userId, provider: 'test'},
  });
  await client.project.create({
    data: {
      name: 'name',
      id: projectId,
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

t.test('DELETE /v1/project/:id [Delete Project] -> 200', async t => {
  const fastify = await build(t);
  const userId = 'd8f4fe3f-199f-4a97-8f08-10b21c8e7cdd';
  const projectId = 'a7a1cb1d-2e4c-4f2f-8801-f73adddd8a6d';
  const spy = sinon.spy(fastify.projectRepository, 'deleteProject');

  const response = await fastify.inject({
    url: `/api/v1/project/${projectId}`,
    method: 'DELETE',
    headers: {
      'user-id': userId,
    },
  });

  t.ok(spy.withArgs(projectId, userId).calledOnce, 'has been called once');
  t.same(response.statusCode, 200, 'return status 200');
});

cleanSeed();
