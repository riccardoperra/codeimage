import {Project} from '@codeimage/prisma-models';
import * as sinon from 'sinon';
import t from 'tap';

import {build} from '../../../helper';
import {projectSeed, userSeed} from '../../../helpers/seed';

t.before(async () => {
  const user = await userSeed.createUser();
  const project1 = await projectSeed.createProject('get by id test', user.id);
  t.context.user = user;
  t.context.project1 = project1;
});

t.test('/v1/project -> 200', async t => {
  const fastify = await build(t);
  const projectId = t.context.project1.id;
  const spy = sinon.spy(fastify.projectService, 'findById');

  const response = await fastify.inject({
    url: `/api/v1/project/${projectId}`,
    method: 'GET',
  });

  const body = JSON.parse(response.body) as Project;

  t.ok(spy.withArgs(t.context.user, projectId).calledOnce);
  t.same(response.statusCode, 200);
  t.same(body.id, projectId);
  t.same(body.name, 'get by id test');
});

t.test('/v1/project -> 404', async t => {
  const fastify = await build(t);
  const userId = t.context.user.id;
  const projectId = 'badId';
  const spy = sinon.spy(fastify.projectService, 'findById');

  const response = await fastify.inject({
    url: `/api/v1/project/${projectId}`,
    method: 'GET',
    headers: {
      'user-id': userId,
    },
  });

  const body = JSON.parse(response.body);

  t.ok(spy.withArgs(t.context.user, projectId).calledOnce);
  t.same(response.statusCode, 404);
  t.same(body.message, `Project with id ${projectId} not found`);
});
