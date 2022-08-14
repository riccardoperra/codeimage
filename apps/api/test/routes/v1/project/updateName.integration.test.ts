import * as sinon from 'sinon';
import t from 'tap';

import {build} from '../../../helper';
import {projectSeed, userSeed} from '../../../helpers/seed';

t.before(async () => {
  const user = await userSeed.createUser();
  const project1 = await projectSeed.createProject('update name test', user.id);
  t.context.user = user;
  t.context.project1 = project1;
});

t.test('PUT /v1/project/:id/name [Update Name] -> 200', async t => {
  const fastify = await build(t);
  const userId = t.context.user.id;
  const newName = 'newName';
  const projectId = t.context.project1.id;
  const spy = sinon.spy(fastify.projectService, 'updateName');

  const response = await fastify.inject({
    url: `/api/v1/project/${projectId}/name`,
    method: 'PUT',
    payload: {name: newName},
  });

  t.ok(
    spy.withArgs(userId, projectId, 'newName').calledOnce,
    'has been called once',
  );
  t.same(response.statusCode, 200, 'return status 200');
  t.equal(JSON.parse(response.body).name, newName, 'return updated name');
});
