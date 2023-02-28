import {User} from '@codeimage/prisma-models';
import * as sinon from 'sinon';
import {test} from 'tap';
import {ProjectGetByIdResponse} from '../../../../src/modules/project/domain';
import {ProjectNotFoundException} from '../../../../src/modules/project/exceptions/projectNotFoundException';
import findById from '../../../../src/modules/project/handlers/findById';
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

test('findById -> should return 404 error when not found project', async t => {
  const id = 'projectId1';
  const user: User = {
    id: 'userId1',
    email: 'email@example.it',
    createdAt: new Date(),
  };
  const dependencies = makeMockProjectService();
  sinon.stub(dependencies.repository, 'findById').callsFake(async () => null);

  await t.rejects(
    findById(dependencies)(user, id),
    'will reject',
    new ProjectNotFoundException({id}),
  );
});

test('findById -> should return 404 error when not found project', async t => {
  const id = 'projectId1';
  const user: User = {
    id: 'userId1',
    email: 'email@example.it',
    createdAt: new Date(),
  };
  const dependencies = makeMockProjectService();
  sinon.stub(dependencies.repository, 'findById').callsFake(async () => null);

  await t.rejects(
    findById(dependencies)(user, id),
    'will reject',
    new ProjectNotFoundException({id}),
  );
});

test('findById -> should return project', async t => {
  const id = 'projectId1';
  const user: User = {
    id: 'userId1',
    email: 'email@example.it',
    createdAt: new Date(),
  };
  const dependencies = makeMockProjectService();

  sinon
    .stub(dependencies.repository, 'findById')
    .withArgs(id)
    .callsFake(() =>
      Promise.resolve({
        ...baseResponse,
        ownerId: 'userId1',
      }),
    );

  const result = await findById(dependencies)(user, id);

  t.ok(result.isOwner);
  t.same(result.ownerId, user.id);
  t.same(result.name, 'project1');
});

test('findById -> should return project and not owner', async t => {
  const id = 'projectId1';
  const user: User = {
    id: 'userId2',
    email: 'email@example.it',
    createdAt: new Date(),
  };
  const dependencies = makeMockProjectService();

  sinon
    .stub(dependencies.repository, 'findById')
    .withArgs(id)
    .callsFake(() =>
      Promise.resolve({
        ...baseResponse,
        ownerId: 'differentOwner',
        id: '1',
      } as ProjectGetByIdResponse),
    );

  const result = await findById(dependencies)(user, id);

  t.notOk(result.isOwner);
  t.same(result.ownerId, 'differentOwner');
  t.same(result.name, 'project1');
});
