import {afterEach, expect, test} from 'vitest';
import {build} from '../helpers/app.js';
import {clearAllSeeds, client, projectSeed, userSeed} from '../helpers/seed.js';

afterEach(clearAllSeeds);

test('required routes return 401 with no valid session', async t => {
  const app = await build(t, {as: null});
  const response = await app.inject('/api/v1/preset');
  expect(response.statusCode).toBe(401);
  expect(response.json()).toMatchObject({
    statusCode: 401,
    message: 'Unauthorized',
  });
});

test('optional project reads allow anonymous viewers and identify the owner', async t => {
  const user = await userSeed.createUser();
  const project = await projectSeed.createProject('shared', user.id);
  const anonymous = await build(t, {as: null});
  const response = await anonymous.inject(`/api/v1/project/${project.id}`);
  expect(response.statusCode).toBe(200);
  expect(response.json()).toMatchObject({id: project.id, isOwner: false});
  const owner = await build(t, {as: user});
  expect(
    (await owner.inject(`/api/v1/project/${project.id}`)).json(),
  ).toMatchObject({isOwner: true});
});

test('sessions provision one user row and reuse it', async t => {
  const email = 'provision@example.it';
  const app = await build(t, {as: {email}});
  for (let i = 0; i < 2; i++)
    expect((await app.inject('/api/v1/preset')).statusCode).toBe(200);
  expect(await client.user.count({where: {email}})).toBe(1);
});

test('a session without email is 400 even on an optional route', async t => {
  const app = await build(t, {as: {email: ''}});
  const response = await app.inject('/api/v1/project/unknown');
  expect(response.statusCode).toBe(400);
  expect(response.json()).toMatchObject({
    statusCode: 400,
    message: 'No valid user data',
    error: 'Bad Request',
  });
});

test('MOCK_AUTH provisions the configured email', async t => {
  const app = await build(t, {
    as: null,
    config: {MOCK_AUTH: true, MOCK_AUTH_EMAIL: 'dev@example.it'},
  });
  expect((await app.inject('/api/v1/preset')).statusCode).toBe(200);
  expect(
    await client.user.findUnique({where: {email: 'dev@example.it'}}),
  ).toMatchObject({email: 'dev@example.it'});
});
