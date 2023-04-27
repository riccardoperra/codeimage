import {FastifyError} from 'fastify';
import * as sinon from 'sinon';
import t from 'tap';
import {PresetDto} from '../../../../src/modules/preset/schema/preset-dto.schema';

import {build} from '../../../helper';
import {presetSeed, userSeed} from '../../../helpers/seed';

t.before(async () => {
  const user = await userSeed.createUser();
  const preset1 = await presetSeed.createPresetV1('preset-1', user.id);
  t.context.user = user;
  t.context.preset1 = preset1;
});

t.test('/v1/preset/:id -> when preset found -> 200', async t => {
  const fastify = await build(t);
  const presetId = t.context.preset1.id;
  const spy = sinon.spy(fastify.presetService, 'findPresetById');

  const response = await fastify.inject({
    url: `/api/v1/preset/${presetId}`,
    method: 'GET',
  });

  const body = response.json<PresetDto>();

  t.ok(spy.withArgs(t.context.user.id, presetId).calledOnce);
  t.same(response.statusCode, 200);
  t.same(body.id, presetId);
  t.same(body.name, 'preset-1');
  t.same(body.version, BigInt(1));
});

t.test('/v1/preset/:id -> when preset not found -> 404', async t => {
  const fastify = await build(t);
  const userId = t.context.user.id;
  const presetId = 'badId';
  const spy = sinon.spy(fastify.presetService, 'findPresetById');

  const response = await fastify.inject({
    url: `/api/v1/preset/${presetId}`,
    method: 'GET',
    headers: {
      'user-id': userId,
    },
  });

  const body = response.json<FastifyError>();

  t.ok(spy.withArgs(userId, presetId).calledOnce);
  t.same(response.statusCode, 404);
  t.same(body.code, 'NotFoundPresetException');
  t.same(
    body.message,
    `Preset with id ${presetId} for user ${userId} not found`,
  );
});
