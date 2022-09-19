import * as sinon from 'sinon';
import t from 'tap';
import {ProjectCreateResponse} from '../../../../src/modules/project/schema';

import {build} from '../../../helper';
import {projectSeed, userSeed} from '../../../helpers/seed';

t.before(async () => {
  const user = await userSeed.createUser();
  const user2 = await userSeed.createUser();
  const existingProject = await projectSeed.createProject(
    'existing project',
    user2.id,
  );
  t.context.user = user;
  t.context.user2 = user2;
  t.context.existingProject = existingProject;
});

t.test('/v1/project/:id/clone -> 200', async t => {
  const fastify = await build(t);
  const projectId = t.context.existingProject.id;
  const spy = sinon.spy(fastify.projectRepository, 'findById');
  const createSpy = sinon.spy(fastify.projectService, 'createNewProject');

  const response = await fastify.inject({
    url: `/api/v1/project/${projectId}/clone`,
    method: 'POST',
    payload: {
      newName: 'new name (copy)',
    },
  });

  const body = response.json<ProjectCreateResponse>();

  t.ok(spy.withArgs(projectId).calledOnce);
  t.ok(createSpy.calledOnce);
  t.same(response.statusCode, 200);
  t.notSame(body.id, projectId);
  t.same(body.name, 'new name (copy)');
});

t.test('/v1/project/:id -> 404 -> when project by id not exists', async t => {
  const fastify = await build(t);
  const userId = t.context.user.id;
  const projectId = 'badId';
  const spy = sinon.spy(fastify.projectRepository, 'findById');

  const response = await fastify.inject({
    url: `/api/v1/project/${projectId}/clone`,
    method: 'POST',
    payload: {},
    headers: {
      'user-id': userId,
    },
  });

  const body = response.json();

  t.ok(spy.withArgs(projectId).calledOnce);
  t.same(response.statusCode, 404);
  t.same(
    body.message,
    `Cannot clone project with id ${projectId} since it does not exists`,
  );
});
