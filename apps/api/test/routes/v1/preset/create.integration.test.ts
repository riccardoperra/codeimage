import type {User} from '@codeimage/prisma-models';
import {afterEach, assert, beforeEach, expect, test} from 'vitest';
import type {PresetCreateDto} from '../../../../src/modules/preset/schema/preset-create-dto.schema.js';
import type {PresetDto} from '../../../../src/modules/preset/schema/preset-dto.schema.js';
import {testPresetUtils} from '../../../helpers/preset.js';
import {build} from '../../../helper.js';
import {clearAllSeeds, client, userSeed} from '../../../helpers/seed.js';

interface TestContext {
  user: User;
}

beforeEach<TestContext>(async context => {
  context.user = await userSeed.createUser();
});

afterEach(async () => {
  await clearAllSeeds();
});

test<TestContext>('POST /v1/preset [Create Preset] -> 200', async t => {
  const fastify = await build(t);
  const userId = t.user.id;

  const data = testPresetUtils.buildPresetData();

  const request: PresetCreateDto = {
    name: 'Data',
    data,
  };

  const response = await fastify.inject({
    url: `/api/v1/preset`,
    method: 'POST',
    payload: request,
  });

  const body = response.json<PresetDto>();

  assert.strictEqual(response.statusCode, 200, 'return status 200');
  assert.strictEqual(body.name, 'Data');
});

test('POST /v1/preset [Create Preset] -> Exceed presets limit > 422', async t => {
  const fastify = await build(t);
  const data = testPresetUtils.buildPresetData();
  fastify.config.PRESETS_LIMIT = -1;

  const request: PresetCreateDto = {
    name: 'Data',
    data,
  };

  const response = await fastify.inject({
    url: `/api/v1/preset`,
    method: 'POST',
    payload: request,
  });

  response.json<PresetDto>();

  assert.equal(response.statusCode, 422, 'return status 422');
});
