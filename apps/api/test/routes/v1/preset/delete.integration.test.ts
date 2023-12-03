import {Preset, User} from '@codeimage/prisma-models';
import {afterEach, assert, beforeEach, expect, test, vi} from 'vitest';

import {build} from '../../../helper.js';
import {clearAllSeeds, presetSeed, userSeed} from '../../../helpers/seed.js';

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

test<TestContext>('DELETE /v1/project/:id [Delete Project] -> 200', async t => {
  const fastify = await build(t);
  const userId = t.user.id;
  const presetId = t.preset1.id;
  const spy = vi.spyOn(fastify.presetService, 'deletePreset');

  const response = await fastify.inject({
    url: `/api/v1/preset/${presetId}`,
    method: 'DELETE',
  });

  assert.equal(response.statusCode, 200, 'return status 200');
  expect(spy).toHaveBeenCalledWith(userId, presetId);
});
