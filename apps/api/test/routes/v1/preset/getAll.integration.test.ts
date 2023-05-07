import {Preset, User} from '@codeimage/prisma-models';
import * as sinon from 'sinon';
import {afterEach, assert, beforeEach, test} from 'vitest';
import {PresetDto} from '../../../../src/modules/preset/schema/preset-dto.schema.js';
import {testPresetUtils} from '../../../__internal__/presetUtils.js';
import {build} from '../../../helper.js';
import {presetSeed, userSeed} from '../../../helpers/seed.js';

interface TestContext {
  user: User;
  preset1: Preset;
  preset2: Preset;
}

beforeEach(() => sinon.restore());

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
  await Promise.all([userSeed.clean(), presetSeed.clean()]);
});

test<TestContext>('/v1/preset -> 200', async t => {
  const fastify = await build(t);
  const spy = sinon.spy(fastify.presetService, 'findAllPresets');

  const response = await fastify.inject({
    url: `/api/v1/preset`,
    method: 'GET',
  });

  const body = response.json<PresetDto[]>();

  assert.ok(spy.withArgs(t.user.id).calledOnce);
  assert.equal(response.statusCode, 200);
  assert.equal(body.length, 2);
  assert.equal(body[0].name, t.preset1.name);
  assert.equal(body[1].name, t.preset2.name);
});
