import type {Project, User} from '@codeimage/prisma-models';
import {afterEach, assert, beforeEach, test} from 'vitest';
import type {ProjectGetByIdResponse} from '../../../../src/modules/project/project.contract.js';

import {build} from '../../../helpers/app.js';
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

  const response = await fastify.inject({
    url: '/api/v1/project',
    method: 'GET',
  });

  const body = response.json<ProjectGetByIdResponse[]>();

  assert.ok(body.find(el => el.id === t.project1.id));
  assert.equal(body[0].ownerId, userId);
  assert.equal(response.statusCode, 200);
  assert.equal(body[0].frameId, t.project1.frameId);
  assert.equal(body[0].terminalId, t.project1.terminalId);
  assert.equal(body[0].editorOptionsId, t.project1.editorOptionsId);
});
