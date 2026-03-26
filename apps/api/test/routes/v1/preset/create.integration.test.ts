import type {User} from '@codeimage/prisma-models';
import {afterEach, assert, beforeEach, expect, test, vi} from 'vitest';
import type {PresetCreateDto} from '../../../../src/modules/preset/schema/preset-create-dto.schema.js';
import type {PresetDto} from '../../../../src/modules/preset/schema/preset-dto.schema.js';
import {testPresetUtils} from '../../../__internal__/presetUtils.js';
import {build} from '../../../helper.js';
import {clearAllSeeds, userSeed} from '../../../helpers/seed.js';

interface TestContext {
  user: User;
}

beforeEach(() => vi.restoreAllMocks());

beforeEach<TestContext>(async context => {
  context.user = await userSeed.createUser();
});

afterEach(async () => {
  await clearAllSeeds();
});

test<TestContext>('POST /v1/preset [Create Preset] -> 200', async t => {
  const fastify = await build(t);
  const userId = t.user.id;
  const spy = vi.spyOn(fastify.presetService, 'createPreset');
  const createRepositorySpy = vi.spyOn(fastify.presetRepository, 'create');

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

  expect(spy).toHaveBeenCalledTimes(1);
  expect(spy).toHaveBeenCalledWith(userId, request);
  expect(createRepositorySpy).toHaveBeenCalled();
  assert.strictEqual(response.statusCode, 200, 'return status 200');
  assert.strictEqual(body.name, 'Data');
});

test('POST /v1/preset [Create Preset] -> Exceed presets limit > 422', async t => {
  const fastify = await build(t);
  const createRepositorySpy = vi.spyOn(fastify.presetRepository, 'create');
  const data = testPresetUtils.buildPresetData();
  vi.spyOn(fastify.config, 'PRESETS_LIMIT', 'get').mockReturnValue(-1);

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

  expect(createRepositorySpy).not.toHaveBeenCalled();
  assert.equal(response.statusCode, 422, 'return status 422');
});
