import type {Preset, User} from '@codeimage/prisma-models';
import type {FastifyError} from 'fastify';
import {afterEach, assert, beforeEach, expect, test} from 'vitest';
import type {PresetResponse} from '../../../../src/modules/preset/preset.contract.js';
import type {PresetUpdateBody} from '../../../../src/modules/preset/preset.contract.js';
import {testPresetUtils} from '../../../helpers/preset.js';
import {build} from '../../../helpers/app.js';
import {
  clearAllSeeds,
  client,
  presetSeed,
  userSeed,
} from '../../../helpers/seed.js';

interface TestContext {
  user: User;
  preset1: Preset;
}

beforeEach<TestContext>(async context => {
  const user = await userSeed.createUser();
  const preset1 = await presetSeed.createPresetV1('preset-1', user.id);
  context.user = user;
  context.preset1 = preset1;
});

afterEach(async () => {
  await clearAllSeeds();
});

test<TestContext>('[PUT] /v1/preset/:id -> 200', async context => {
  const fastify = await build(context);
  const presetId = context.preset1.id;

  const request: PresetUpdateBody = {
    data: testPresetUtils.buildPresetData(),
    name: 'updated',
  };

  const response = await fastify.inject({
    url: `/api/v1/preset/${presetId}`,
    method: 'PUT',
    payload: request,
  });

  const body = response.json<PresetResponse>();

  assert.equal(response.statusCode, 200);
  assert.equal(body.name, 'updated');
  expect(await client.preset.findUnique({where: {id: presetId}})).toMatchObject(
    {name: request.name, data: request.data, ownerId: context.user.id},
  );
});

test<TestContext>('[PUT] /v1/preset/:id -> when preset not found -> 404', async context => {
  const fastify = await build(context);
  const userId = context.user.id;
  const presetId = 'badId';

  const request: PresetUpdateBody = {
    name: 'updated',
    data: {test: 'updated'},
  };

  const response = await fastify.inject({
    url: `/api/v1/preset/${presetId}`,
    method: 'PUT',
    payload: request,
  });

  const body = response.json<FastifyError>();

  assert.equal(response.statusCode, 404);
  assert.equal(body.code, 'NotFoundPresetException');
  assert.equal(
    body.message,
    `Preset with id ${presetId} for user ${userId} not found`,
  );
});
