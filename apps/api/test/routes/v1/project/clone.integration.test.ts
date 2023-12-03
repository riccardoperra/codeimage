import {Project, User} from '@codeimage/prisma-models';
import {afterEach, assert, beforeEach, expect, test, vi} from 'vitest';
import {ProjectCreateResponse} from '../../../../src/modules/project/schema/index.js';

import {build} from '../../../helper.js';
import {clearAllSeeds, projectSeed, userSeed} from '../../../helpers/seed.js';

interface TestContext {
  user: User;
  user2: User;
  existingProject: Project;
}

beforeEach<TestContext>(async context => {
  const user = await userSeed.createUser();
  const user2 = await userSeed.createUser();
  const existingProject = await projectSeed.createProject(
    'existing project',
    user2.id,
  );
  context.user = user;
  context.user2 = user2;
  context.existingProject = existingProject;
});

afterEach(async () => {
  await clearAllSeeds();
});

test<TestContext>('/v1/project/:id/clone -> 200', async context => {
  const fastify = await build(context);
  const projectId = context.existingProject.id;
  const spy = vi.spyOn(fastify.projectRepository, 'findById');
  const createSpy = vi.spyOn(fastify.projectService, 'createNewProject');

  const response = await fastify.inject({
    url: `/api/v1/project/${projectId}/clone`,
    method: 'POST',
    payload: {
      newName: 'new name (copy)',
    },
  });

  const body = response.json<ProjectCreateResponse>();

  expect(spy, 'has been called once').toHaveBeenCalledWith(projectId);
  expect(createSpy, 'has been called once').toHaveBeenCalledOnce();
  assert.equal(response.statusCode, 200);
  assert.notEqual(body.id, projectId);
  assert.equal(body.name, 'new name (copy)');
});

test<TestContext>('/v1/project/:id -> 404 -> when project by id not exists', async context => {
  const fastify = await build(context);
  const userId = context.user.id;
  const projectId = 'badId';
  const spy = vi.spyOn(fastify.projectRepository, 'findById');

  const response = await fastify.inject({
    url: `/api/v1/project/${projectId}/clone`,
    method: 'POST',
    payload: {},
    headers: {
      'user-id': userId,
    },
  });

  const body = response.json();

  expect(spy).toHaveBeenCalledWith(projectId);
  assert.equal(response.statusCode, 404);
  assert.equal(
    body.message,
    `Cannot clone project with id ${projectId} since it does not exists`,
  );
});
