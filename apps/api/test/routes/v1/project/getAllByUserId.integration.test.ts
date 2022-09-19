import * as sinon from 'sinon';
import t from 'tap';
import {ProjectGetByIdResponse} from '../../../../src/modules/project/schema';

import {build} from '../../../helper';
import {projectSeed, userSeed} from '../../../helpers/seed';

t.before(async () => {
  const user = await userSeed.createUser();
  const project1 = await projectSeed.createProject('get all test', user.id);
  t.context.user = user;
  t.context.project1 = project1;
});

t.test('/v1/project -> 200', async t => {
  const fastify = await build(t);
  const userId = t.context.user.id;
  const spy = sinon.spy(fastify.projectService, 'findAllByUserId');

  const response = await fastify.inject({
    url: '/api/v1/project',
    method: 'GET',
  });

  const body = response.json<ProjectGetByIdResponse[]>();

  t.ok(spy.withArgs(userId).calledOnce);
  t.ok(body.find(el => el.id === t.context.project1.id));
  t.same(body[0].ownerId, userId);
  t.same(response.statusCode, 200);
});
