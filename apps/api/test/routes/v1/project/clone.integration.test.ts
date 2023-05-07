import {Project, User} from '@codeimage/prisma-models';
import * as sinon from 'sinon';
import {afterEach, assert, beforeEach, test} from 'vitest';
import {ProjectCreateResponse} from '../../../../src/modules/project/schema/index.js';

import {build} from '../../../helper.js';
import {projectSeed, userSeed} from '../../../helpers/seed.js';

interface TestContext {
  user: User;
  user2: User;
  existingProject: Project;
}

beforeEach(() => sinon.restore());

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
  await Promise.all([projectSeed.clean(), userSeed.clean()]);
});

test<TestContext>('/v1/project/:id/clone -> 200', async context => {
  const fastify = await build(context);
  const projectId = context.existingProject.id;
  const spy = sinon.spy(fastify.projectRepository, 'findById');
  const createSpy = sinon.spy(fastify.projectService, 'createNewProject');

  const response = await fastify.inject({
    url: `/api/v1/project/${projectId}/clone`,
    method: 'POST',
    payload: {
      newName: 'new name (copy)',
    },
  });

  const body = response.json<ProjectCreateResponse>();

  assert.ok(spy.withArgs(projectId).calledOnce);
  assert.ok(createSpy.calledOnce);
  assert.equal(response.statusCode, 200);
  assert.notEqual(body.id, projectId);
  assert.equal(body.name, 'new name (copy)');
});

test<TestContext>('/v1/project/:id -> 404 -> when project by id not exists', async context => {
  const fastify = await build(context);
  const userId = context.user.id;
  const projectId = 'badId';
  const spy = sinon.spy(fastify.projectRepository, 'findById');

  const response = await fastify.inject({
    url: `/api/v1/project/${projectId}/clone`,
    method: 'POST',
    payload: {},
    headers: {
      'user-id': userId,
    },
  });

  const body = response.json();

  assert.ok(spy.withArgs(projectId).calledOnce);
  assert.equal(response.statusCode, 404);
  assert.equal(
    body.message,
    `Cannot clone project with id ${projectId} since it does not exists`,
  );
});
