import {Preset, User} from '@codeimage/prisma-models';
import * as sinon from 'sinon';
import {afterEach, assert, beforeEach, test} from 'vitest';

import {build} from '../../../helper.js';
import {presetSeed, userSeed} from '../../../helpers/seed.js';

interface TestContext {
  user: User;
  preset1: Preset;
}

beforeEach(() => sinon.restore());

beforeEach<TestContext>(async context => {
  const user = await userSeed.createUser();
  const preset1 = await presetSeed.createPresetV1('preset-1', user.id);
  context.user = user;
  context.preset1 = preset1;
});

afterEach(async () => {
  await Promise.all([userSeed.clean(), presetSeed.clean()]);
});

test<TestContext>('DELETE /v1/project/:id [Delete Project] -> 200', async t => {
  const fastify = await build(t);
  const userId = t.user.id;
  const presetId = t.preset1.id;
  const spy = sinon.spy(fastify.presetService, 'deletePreset');

  const response = await fastify.inject({
    url: `/api/v1/preset/${presetId}`,
    method: 'DELETE',
  });

  assert.equal(response.statusCode, 200, 'return status 200');
  assert.ok(spy.withArgs(userId, presetId).calledOnce, 'has been called once');
});
