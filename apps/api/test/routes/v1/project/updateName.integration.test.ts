import * as sinon from 'sinon';
import {test, beforeEach, afterEach, assert} from 'vitest';

import {build} from '../../../helper.js';
import {projectSeed, userSeed} from '../../../helpers/seed.js';

interface TestContext {
  user: Awaited<ReturnType<typeof userSeed.createUser>>;
  project1: Awaited<ReturnType<typeof projectSeed.createProject>>;
}

beforeEach(() => sinon.restore());

beforeEach<TestContext>(async context => {
  const user = await userSeed.createUser();
  const project1 = await projectSeed.createProject('update name test', user.id);
  context.user = user;
  context.project1 = project1;
});

afterEach(async () => {
  await Promise.all([userSeed.clean()]);
});

test<TestContext>('PUT /v1/project/:id/name [Update Name] -> 200', async context => {
  const fastify = await build(context);
  const userId = context.user.id;
  const newName = 'newName';
  const projectId = context.project1.id;
  const spy = sinon.spy(fastify.projectService, 'updateName');

  const response = await fastify.inject({
    url: `/api/v1/project/${projectId}/name`,
    method: 'PUT',
    payload: {name: newName},
  });

  assert.ok(
    spy.withArgs(userId, projectId, 'newName').calledOnce,
    'has been called once',
  );
  assert.equal(response.statusCode, 200, 'return status 200');
  assert.equal(JSON.parse(response.body).name, newName, 'return updated name');
});
