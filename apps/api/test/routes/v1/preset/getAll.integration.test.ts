import * as sinon from 'sinon';
import t from 'tap';
import {PresetDto} from '../../../../src/modules/preset/schema/preset-dto.schema';

import {build} from '../../../helper';
import {presetSeed, userSeed} from '../../../helpers/seed';

t.before(async () => {
  const user = await userSeed.createUser();
  const preset1 = await presetSeed.createPresetV1('preset-1', user.id, {
    test: true,
  });
  const preset2 = await presetSeed.createPresetV1('preset-2', user.id, {
    test: true,
  });
  t.context.user = user;
  t.context.preset1 = preset1;
  t.context.preset2 = preset2;
});

t.test('/v1/preset -> 200', async t => {
  const fastify = await build(t);
  const spy = sinon.spy(fastify.presetService, 'findAllPresets');

  const response = await fastify.inject({
    url: `/api/v1/preset`,
    method: 'GET',
  });

  const body = response.json<PresetDto[]>();

  t.ok(spy.withArgs(t.context.user.id).calledOnce);
  t.same(response.statusCode, 200);
  t.same(body.length, 2);
  t.same(body[0].name, t.context.preset1.name);
  t.same(body[1].name, t.context.preset2.name);
});
