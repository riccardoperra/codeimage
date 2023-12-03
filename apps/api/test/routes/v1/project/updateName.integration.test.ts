import {afterAll, assert, beforeEach, expect, test, vi} from 'vitest';

import {build} from '../../../helper.js';
import {clearAllSeeds, projectSeed, userSeed} from '../../../helpers/seed.js';

interface TestContext {
  user: Awaited<ReturnType<typeof userSeed.createUser>>;
  project1: Awaited<ReturnType<typeof projectSeed.createProject>>;
}

beforeEach<TestContext>(async context => {
  const user = await userSeed.createUser();
  const project1 = await projectSeed.createProject('update name test', user.id);
  context.user = user;
  context.project1 = project1;
});

afterAll(async () => {
  await clearAllSeeds();
});

test<TestContext>('PUT /v1/project/:id/name [Update Name] -> 200', async context => {
  const fastify = await build(context);
  const userId = context.user.id;
  const newName = 'newName';
  const projectId = context.project1.id;
  const spy = vi.spyOn(fastify.projectService, 'updateName');

  const response = await fastify.inject({
    url: `/api/v1/project/${projectId}/name`,
    method: 'PUT',
    payload: {name: newName},
  });

  expect(spy, 'has been called once').toHaveBeenCalledWith(
    userId,
    projectId,
    'newName',
  );
  assert.equal(response.statusCode, 200, 'return status 200');
  assert.equal(JSON.parse(response.body).name, newName, 'return updated name');
});
