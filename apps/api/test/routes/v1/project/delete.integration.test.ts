import {Project, User} from '@codeimage/prisma-models';
import {afterEach, assert, beforeEach, expect, test, vi} from 'vitest';

import {build} from '../../../helper.js';
import {projectSeed, userSeed} from '../../../helpers/seed.js';

interface TestContext {
  user: User;
  project1: Project;
}

beforeEach<TestContext>(async context => {
  const user = await userSeed.createUser();
  const project1 = await projectSeed.createProject('delete test', user.id);
  context.user = user;
  context.project1 = project1;
});

afterEach(async () => {
  await Promise.all([userSeed.clean()]);
});

await Promise.all([userSeed.clean(), projectSeed.clean()]);

test<TestContext>('DELETE /v1/project/:id [Delete Project] -> 200', async context => {
  const fastify = await build(context);
  const userId = context.user.id;
  const projectId = context.project1.id;
  const spy = vi.spyOn(fastify.projectRepository, 'deleteProject');

  const response = await fastify.inject({
    url: `/api/v1/project/${projectId}`,
    method: 'DELETE',
  });

  expect(spy).toHaveBeenCalledWith(projectId, userId);
  assert.equal(response.statusCode, 200, 'return status 200');
});
