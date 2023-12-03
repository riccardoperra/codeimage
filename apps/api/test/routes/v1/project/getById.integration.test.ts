import {Project, User} from '@codeimage/prisma-models';
import {afterEach, assert, beforeEach, expect, test, vi} from 'vitest';

import {build} from '../../../helper.js';
import {clearAllSeeds, projectSeed, userSeed} from '../../../helpers/seed.js';

interface TestContext {
  user: User;
  project1: Project;
}

beforeEach<TestContext>(async context => {
  const user = await userSeed.createUser();
  const project1 = await projectSeed.createProject('get by id test', user.id);
  context.user = user;
  context.project1 = project1;
});

afterEach(async () => {
  await clearAllSeeds();
});

test<TestContext>('/v1/project -> 200', async context => {
  const fastify = await build(context);
  const projectId = context.project1.id;
  const spy = vi.spyOn(fastify.projectService, 'findById');

  const response = await fastify.inject({
    url: `/api/v1/project/${projectId}`,
    method: 'GET',
  });

  const body = JSON.parse(response.body) as Project;

  expect(spy, 'has been called once').toHaveBeenCalledWith(
    context.user,
    projectId,
  );
  assert.equal(response.statusCode, 200);
  assert.equal(body.id, projectId);
  assert.equal(body.name, 'get by id test');
});

test<TestContext>('/v1/project -> 404', async context => {
  const fastify = await build(context);
  const projectId = 'badId';
  const spy = vi.spyOn(fastify.projectService, 'findById');

  const response = await fastify.inject({
    url: `/api/v1/project/${projectId}`,
    method: 'GET',
  });

  const body = JSON.parse(response.body);

  expect(spy, 'has been called once').toHaveBeenCalledWith(
    context.user,
    projectId,
  );
  assert.equal(response.statusCode, 404);
  assert.equal(body.message, `Project with id ${projectId} not found`);
});
