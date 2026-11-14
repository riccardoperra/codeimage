import type {Preset, User} from '@codeimage/prisma-models';
import {afterEach, assert, beforeEach, test} from 'vitest';
import type {PresetDto} from '../../../../src/modules/preset/preset.contract.js';
import {testPresetUtils} from '../../../helpers/preset.js';
import {build} from '../../../helper.js';
import {clearAllSeeds, presetSeed, userSeed} from '../../../helpers/seed.js';

interface TestContext {
  user: User;
  preset1: Preset;
  preset2: Preset;
}

beforeEach<TestContext>(async context => {
  const user = await userSeed.createUser();
  const preset1 = await presetSeed.createPresetV1(
    'preset-1',
    user.id,
    testPresetUtils.buildPresetData(),
  );
  const preset2 = await presetSeed.createPresetV1(
    'preset-2',
    user.id,
    testPresetUtils.buildPresetData(),
  );
  context.user = user;
  context.preset1 = preset1;
  context.preset2 = preset2;
});

afterEach(async () => {
  await clearAllSeeds();
});

test<TestContext>('/v1/preset -> 200', async t => {
  const fastify = await build(t);

  const response = await fastify.inject({
    url: `/api/v1/preset`,
    method: 'GET',
  });

  const body = response.json<PresetDto[]>();

  assert.equal(response.statusCode, 200);
  assert.equal(body.length, 2);
  assert.equal(body[0].name, t.preset1.name);
  assert.equal(body[1].name, t.preset2.name);
});
