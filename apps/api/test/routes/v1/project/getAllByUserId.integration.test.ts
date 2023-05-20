import {Project, User} from '@codeimage/prisma-models';
import * as sinon from 'sinon';
import {afterEach, assert, beforeEach, test} from 'vitest';
import {ProjectGetByIdResponse} from '../../../../src/modules/project/schema/index.js';

import {build} from '../../../helper.js';
import {projectSeed, userSeed} from '../../../helpers/seed.js';

interface TestContext {
  user: User;
  project1: Project;
}

beforeEach(() => sinon.restore());

beforeEach<TestContext>(async context => {
  const user = await userSeed.createUser();
  const project1 = await projectSeed.createProject('get all test', user.id);
  context.user = user;
  context.project1 = project1;
});

afterEach(async () => {
  await Promise.all([userSeed.clean(), projectSeed.clean()]);
});

test<TestContext>('/v1/project -> 200', async t => {
  const fastify = await build(t);
  const userId = t.user.id;
  const spy = sinon.spy(fastify.projectService, 'findAllByUserId');

  const response = await fastify.inject({
    url: '/api/v1/project',
    method: 'GET',
  });

  const body = response.json<ProjectGetByIdResponse[]>();

  assert.ok(spy.withArgs(userId).calledOnce);
  assert.ok(body.find(el => el.id === t.project1.id));
  assert.equal(body[0].ownerId, userId);
  assert.equal(response.statusCode, 200);
});
