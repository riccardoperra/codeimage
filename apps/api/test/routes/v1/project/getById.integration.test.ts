import {Project, User} from '@codeimage/prisma-models';
import * as sinon from 'sinon';
import {afterEach, assert, beforeEach, test} from 'vitest';

import {build} from '../../../helper.js';
import {projectSeed, userSeed} from '../../../helpers/seed.js';

interface TestContext {
  user: User;
  project1: Project;
}

beforeEach(() => sinon.restore());

beforeEach<TestContext>(async context => {
  const user = await userSeed.createUser();
  const project1 = await projectSeed.createProject('get by id test', user.id);
  context.user = user;
  context.project1 = project1;
});

afterEach(async () => {
  await Promise.all([userSeed.clean(), projectSeed.clean()]);
});

test<TestContext>('/v1/project -> 200', async context => {
  const fastify = await build(context);
  const projectId = context.project1.id;
  const spy = sinon.spy(fastify.projectService, 'findById');

  const response = await fastify.inject({
    url: `/api/v1/project/${projectId}`,
    method: 'GET',
  });

  const body = JSON.parse(response.body) as Project;

  assert.ok(spy.withArgs(context.user, projectId).calledOnce);
  assert.equal(response.statusCode, 200);
  assert.equal(body.id, projectId);
  assert.equal(body.name, 'get by id test');
});

test<TestContext>('/v1/project -> 404', async context => {
  const fastify = await build(context);
  const userId = context.user.id;
  const projectId = 'badId';
  const spy = sinon.spy(fastify.projectService, 'findById');

  const response = await fastify.inject({
    url: `/api/v1/project/${projectId}`,
    method: 'GET',
    headers: {
      'user-id': userId,
    },
  });

  const body = JSON.parse(response.body);

  assert.ok(spy.withArgs(context.user, projectId).calledOnce);
  assert.equal(response.statusCode, 404);
  assert.equal(body.message, `Project with id ${projectId} not found`);
});
