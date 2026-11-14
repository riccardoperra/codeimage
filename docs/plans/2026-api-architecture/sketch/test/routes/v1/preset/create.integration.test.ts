/**
 * POST /api/v1/preset. Integration tests stay where they are today: test/routes/v1/<module>/<operation>,
 * mirroring URLs, because they test HTTP behavior, not files. They are the behavioral spec (constraint 2):
 * every status code, `code` and message assertion of today's file is kept; only the spies are replaced
 * by assertions on the response and on the database.
 */
import type {User} from '@codeimage/prisma-models';
import {afterEach, beforeEach, expect, test} from 'vitest';
import type {PresetApi} from '../../../../src/api-types.js';
import type {ErrorEnvelope} from '../../../../src/shared/contract.js';
import {build} from '../../../helpers/app.js';
import {presetData} from '../../../helpers/fakes.js';
import {clearAllSeeds, client, presetSeed, userSeed} from '../../../helpers/seed.js';

interface TestContext {
  user: User;
}

type CreateBody = NonNullable<PresetApi['create']['request']['body']>;

beforeEach<TestContext>(async context => {
  context.user = await userSeed.createUser();
});

afterEach(async () => {
  await clearAllSeeds();
});

const countFor = (ownerId: string) => client.preset.count({where: {ownerId}});

test<TestContext>('POST /api/v1/preset -> 200, stores the preset for the caller', async t => {
  const app = await build(t);
  const payload: CreateBody = {name: 'Data', data: presetData()};

  const response = await app.inject({method: 'POST', url: '/api/v1/preset', payload});

  expect(response.statusCode).toBe(200);
  const body = response.json<PresetApi['create']['response']>();
  expect(body).toMatchObject({name: 'Data', version: 1});
  expect('ownerId' in body, 'the response schema whitelists fields').toBe(false);
  expect(response.headers['request-id']).toBeTruthy();
  expect(await countFor(t.user.id)).toBe(1);
});

test<TestContext>('POST /api/v1/preset -> 422 ExceedPresetLimitException over the limit, nothing stored', async t => {
  // Was: vi.spyOn(fastify.config, 'PRESETS_LIMIT', 'get').mockReturnValue(-1). Now real data and real config.
  await presetSeed.createPresetV1('a', t.user.id);
  await presetSeed.createPresetV1('b', t.user.id);
  const app = await build(t, {config: {PRESETS_LIMIT: 1}});

  const response = await app.inject({
    method: 'POST',
    url: '/api/v1/preset',
    payload: {name: 'Data', data: presetData()} satisfies CreateBody,
  });

  expect(response.statusCode).toBe(422);
  expect(response.json<ErrorEnvelope>()).toMatchObject({
    code: 'ExceedPresetLimitException',
    message: 'Preset limit per account exceeded',
    requestId: response.headers['request-id'],
  });
  expect(await countFor(t.user.id)).toBe(2);
});

test<TestContext>('POST /api/v1/preset -> 401 UNAUTHENTICATED without a session', async t => {
  const app = await build(t, {as: null});

  const response = await app.inject({
    method: 'POST',
    url: '/api/v1/preset',
    payload: {name: 'Data', data: presetData()} satisfies CreateBody,
  });

  expect(response.statusCode).toBe(401);
  expect(response.json<ErrorEnvelope>()).toMatchObject({
    code: 'UNAUTHENTICATED',
    message: 'Unauthorized',
  });
});

test<TestContext>('POST /api/v1/preset -> 400 INVALID_REQUEST when data is malformed', async t => {
  const app = await build(t);

  const response = await app.inject({
    method: 'POST',
    url: '/api/v1/preset',
    payload: {name: 'Data', data: {appVersion: 1}},
  });

  expect(response.statusCode).toBe(400);
  expect(response.json<ErrorEnvelope>().code).toBe('INVALID_REQUEST');
  expect(await countFor(t.user.id)).toBe(0);
});
