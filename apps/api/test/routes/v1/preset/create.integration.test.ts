import {User} from '@codeimage/prisma-models';
import * as sinon from 'sinon';
import {afterEach, assert, beforeAll, beforeEach, test} from 'vitest';
import {PresetCreateDto} from '../../../../src/modules/preset/schema/preset-create-dto.schema.js';
import {PresetDto} from '../../../../src/modules/preset/schema/preset-dto.schema.js';
import {testPresetUtils} from '../../../__internal__/presetUtils.js';
import {build} from '../../../helper.js';
import {userSeed} from '../../../helpers/seed.js';

interface TestContext {
  user: User;
}

beforeEach(() => sinon.restore());

beforeEach<TestContext>(async context => {
  context.user = await userSeed.createUser();
});

afterEach(async () => {
  await userSeed.clean();
});

test<TestContext>('POST /v1/preset [Create Preset] -> 200', async t => {
  const fastify = await build(t);
  const userId = t.user.id;
  const spy = sinon.spy(fastify.presetService, 'createPreset');
  const createRepositorySpy = sinon.spy(fastify.presetRepository, 'create');

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

  assert.ok(spy.withArgs(userId, request).calledOnce, 'has been called once');
  assert.ok(createRepositorySpy.called);
  assert.strictEqual(response.statusCode, 200, 'return status 200');
  assert.strictEqual(body.name, 'Data');
});

test('POST /v1/preset [Create Preset] -> Exceed presets limit > 422', async t => {
  const fastify = await build(t);
  const createRepositorySpy = sinon.spy(fastify.presetRepository, 'create');
  const data = testPresetUtils.buildPresetData();
  sinon.stub(fastify.config, 'PRESETS_LIMIT').value(-1);

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

  assert.ok(createRepositorySpy.notCalled);
  assert.equal(response.statusCode, 422, 'return status 422');
});
