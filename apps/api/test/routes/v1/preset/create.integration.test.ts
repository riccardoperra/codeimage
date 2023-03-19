import * as sinon from 'sinon';
import t from 'tap';
import {PresetCreateDto} from '../../../../src/modules/preset/schema/preset-create-dto.schema';
import {PresetDto} from '../../../../src/modules/preset/schema/preset-dto.schema';

import {build} from '../../../helper';
import {userSeed} from '../../../helpers/seed';

t.before(async () => {
  t.context.user = await userSeed.createUser();
});

t.test('POST /v1/preset [Create Preset] -> 200', async t => {
  const fastify = await build(t);
  const userId = t.context.user.id;
  const spy = sinon.spy(fastify.presetService, 'createPreset');
  const createRepositorySpy = sinon.spy(fastify.presetRepository, 'create');

  const request: PresetCreateDto = {
    name: 'Data',
    data: {test: true},
  };

  const response = await fastify.inject({
    url: `/api/v1/preset`,
    method: 'POST',
    payload: request,
  });

  const body = response.json<PresetDto>();

  t.ok(spy.withArgs(userId, request).calledOnce, 'has been called once');
  t.ok(createRepositorySpy.called);
  t.same(response.statusCode, 200, 'return status 200');
  t.strictSame(body.name, 'Data');
});
