import {Project, User} from '@codeimage/prisma-models';
import {afterEach, assert, beforeEach, expect, test, vi} from 'vitest';
import {ProjectGetByIdResponse} from '../../../../src/modules/project/schema/index.js';

import {build} from '../../../helper.js';
import {clearAllSeeds, projectSeed, userSeed} from '../../../helpers/seed.js';

interface TestContext {
  user: User;
  project1: Project;
}

beforeEach<TestContext>(async context => {
  const user = await userSeed.createUser();
  const project1 = await projectSeed.createProject('get all test', user.id);
  context.user = user;
  context.project1 = project1;
});

afterEach(async () => {
  await clearAllSeeds();
});

test<TestContext>('/v1/project -> 200', async t => {
  const fastify = await build(t);
  const userId = t.user.id;
  const spy = vi.spyOn(fastify.projectService, 'findAllByUserId');

  const response = await fastify.inject({
    url: '/api/v1/project',
    method: 'GET',
  });

  const body = response.json<ProjectGetByIdResponse[]>();

  expect(spy, 'has been called once').toHaveBeenCalledWith(userId);
  assert.ok(body.find(el => el.id === t.project1.id));
  assert.equal(body[0].ownerId, userId);
  assert.equal(response.statusCode, 200);
});
