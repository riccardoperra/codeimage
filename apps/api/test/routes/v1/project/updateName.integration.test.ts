import {afterAll, assert, beforeEach, expect, test} from 'vitest';

import {build} from '../../../helper.js';
import {
  clearAllSeeds,
  client,
  projectSeed,
  userSeed,
} from '../../../helpers/seed.js';

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

  const response = await fastify.inject({
    url: `/api/v1/project/${projectId}/name`,
    method: 'PUT',
    payload: {name: newName},
  });

  assert.equal(response.statusCode, 200, 'return status 200');
  assert.equal(JSON.parse(response.body).name, newName, 'return updated name');
  expect(
    await client.project.findUnique({where: {id: projectId}}),
  ).toMatchObject({name: newName, ownerId: userId});
});

test<TestContext>('PUT /v1/project/:id/name [Update Name] -> 404 when the project belongs to another user', async context => {
  const fastify = await build(context);
  const otherUser = await userSeed.createUser();
  const otherProject = await projectSeed.createProject(
    'owned by another user',
    otherUser.id,
  );

  const response = await fastify.inject({
    url: `/api/v1/project/${otherProject.id}/name`,
    method: 'PUT',
    payload: {name: 'renamed by a stranger'},
  });

  const stored = await client.project.findUniqueOrThrow({
    where: {id: otherProject.id},
  });

  assert.equal(response.statusCode, 404, 'return status 404');
  assert.equal(stored.name, 'owned by another user', 'keeps the stored name');
});
