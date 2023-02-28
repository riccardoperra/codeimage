import {User} from '@codeimage/prisma-models';
import * as sinon from 'sinon';
import t from 'tap';
import {DomainHandlerRegistry} from '../../../../src/common/domainFunctions/registerHandlers';
import {NotFoundEntityException} from '../../../../src/common/exceptions/notFoundEntityException';
import {ProjectGetByIdResponse} from '../../../../src/modules/project/domain';
import clone from '../../../../src/modules/project/handlers/clone';
import createNewProject from '../../../../src/modules/project/handlers/createNewProject';
import {makeMockProjectService} from './project.service.test';

const baseResponse = {
  ownerId: 'userId',
  id: '1',
  createdAt: new Date(),
  updatedAt: new Date(),
  editorTabs: [],
  editorOptions: {
    id: 'editorOptionsId1',
    fontId: 'fontId',
    fontWeight: 300,
    showLineNumbers: true,
    themeId: 'themeId',
  },
  frame: {
    background: '#fff',
    opacity: 1,
    padding: 32,
    id: 'frameId1',
    radius: 32,
    visible: true,
  },
  terminal: {
    opacity: 1,
    background: '#fff',
    id: 'terminalId1',
    showGlassReflection: true,
    showHeader: true,
    alternativeTheme: false,
    shadow: null,
    textColor: '#fff',
    type: 'macOS',
    showWatermark: true,
    accentVisible: true,
  },
  terminalId: 'terminalId1',
  editorOptionsId: 'editorOptionsId1',
  frameId: 'frameId1',
  name: 'project1',
} as ProjectGetByIdResponse;

t.test('clone -> should return cloned project', async t => {
  const dependencies = makeMockProjectService();
  sinon.stub(dependencies.repository, 'findById').callsFake(async () => ({
    ...baseResponse,
    name: 'Existing',
    ownerId: 'userId1',
  }));
  const user: User = {
    id: 'userId1',
    email: 'email@example.it',
    createdAt: new Date(),
  };

  const createNewProjectStub = sinon
    .stub(DomainHandlerRegistry, 'callHandler')
    .withArgs(createNewProject, user.id, sinon.match.any)
    .resolves({
      ...baseResponse,
      id: baseResponse.id,
      name: 'Existing',
    });

  const result1 = await clone(dependencies)(user, 'projectId1', null);

  t.ok(createNewProjectStub.calledOnce);
  t.same(result1.name, 'Existing');

  sinon.restore();

  sinon.stub(dependencies.repository, 'findById').callsFake(async () => ({
    ...baseResponse,
    name: 'Existing',
    ownerId: 'userId1',
  }));

  const createNewProjectStub2 = sinon
    .stub(DomainHandlerRegistry, 'callHandler')
    .withArgs(createNewProject, user.id, sinon.match.any)
    .resolves({
      ...baseResponse,
      id: baseResponse.id,
      name: 'new name',
    });

  const result2 = await clone(dependencies)(user, 'projectId1', 'new name');
  t.same(result2.name, 'new name');
  t.ok(createNewProjectStub2.calledOnce);
});

t.test('clone -> should not wrap exception', {only: true}, async t => {
  const id = 'projectId1';
  const user: User = {
    id: 'userId1',
    email: 'email@example.it',
    createdAt: new Date(),
  };
  const dependencies = makeMockProjectService();

  const error = new Error('same exception');

  sinon
    .stub(dependencies.repository, 'findById')
    .callsFake(async () => Promise.reject(error));

  await t.rejects(clone(dependencies)(user, id, null), error);

  sinon.restore();

  sinon
    .stub(dependencies.repository, 'findById')
    .callsFake(async () => Promise.reject(new NotFoundEntityException()));

  await t.rejects(clone(dependencies)(user, id, null), {
    message: `Cannot clone project with id ${id} since it does not exists`,
  });
});
