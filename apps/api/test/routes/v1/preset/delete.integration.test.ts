import * as sinon from 'sinon';
import t from 'tap';

import {build} from '../../../helper';
import {presetSeed, userSeed} from '../../../helpers/seed';

t.before(async () => {
  const user = await userSeed.createUser();
  const preset1 = await presetSeed.createPresetV1('preset-1', user.id);
  t.context.user = user;
  t.context.preset1 = preset1;
});

t.test('DELETE /v1/project/:id [Delete Project] -> 200', async t => {
  const fastify = await build(t);
  const userId = t.context.user.id;
  const presetId = t.context.preset1.id;
  const spy = sinon.spy(fastify.presetService, 'deletePreset');

  const response = await fastify.inject({
    url: `/api/v1/preset/${presetId}`,
    method: 'DELETE',
  });

  t.same(response.statusCode, 200, 'return status 200');
  t.ok(spy.withArgs(userId, presetId).calledOnce, 'has been called once');
});
