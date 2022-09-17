import * as sinon from 'sinon';
import t from 'tap';

import {build} from '../../../helper';
import {projectSeed, userSeed} from '../../../helpers/seed';

t.before(async () => {
  const user = await userSeed.createUser();
  const project1 = await projectSeed.createProject('delete test', user.id);
  t.context.user = user;
  t.context.project1 = project1;
});

t.test('DELETE /v1/project/:id [Delete Project] -> 200', async t => {
  const fastify = await build(t);
  const userId = t.context.user.id;
  const projectId = t.context.project1.id;
  const spy = sinon.spy(fastify.projectRepository, 'deleteProject');

  const response = await fastify.inject({
    url: `/api/v1/project/${projectId}`,
    method: 'DELETE',
  });

  t.ok(spy.withArgs(projectId, userId).calledOnce, 'has been called once');
  t.same(response.statusCode, 200, 'return status 200');
});
