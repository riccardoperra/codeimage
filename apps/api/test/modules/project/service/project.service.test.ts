import type {User} from '@codeimage/prisma-models';
import {assert, beforeEach, expect, test, vi} from 'vitest';
import type {
  ProjectCreateResponse,
  ProjectGetByIdResponse,
} from '../../../../src/modules/project/domain/index.js';
import {makeProjectService} from '../../../../src/modules/project/handlers/project.service.js';
import type {ProjectRepository} from '../../../../src/modules/project/repository/index.js';

export function makeMockProjectService() {
  const repository = {
    findById: () => void 0,
    findByUserId: () => void 0,
    create: () => void 0,
    createNewProject: () => void 0,
    update: () => void 0,
    delete: () => void 0,
  } as unknown as ProjectRepository;

  return {
    service: makeProjectService(repository),
    repository,
  };
}

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
    enableLigatures: true,
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

beforeEach(() => vi.restoreAllMocks());

test('create project', async () => {
  const {repository, service} = makeMockProjectService();
  const data = {
    name: 'new project',
    editorOptions: {
      fontId: 'fontId',
      fontWeight: 300,
      showLineNumbers: true,
      themeId: 'themeId',
      enableLigatures: true,
    },
    editors: [],
    frame: {
      background: '#fff',
      opacity: 1,
      padding: 32,
      radius: 32,
      visible: true,
    },
    terminal: {
      opacity: 1,
      background: '#fff',
      accentVisible: true,
      alternativeTheme: false,
      shadow: null,
      showGlassReflection: true,
      showHeader: true,
      showWatermark: true,
      textColor: '#fff',
      type: 'macOS',
    },
  };

  vi.spyOn(repository, 'createNewProject').mockResolvedValue({
    ...data,
    updatedAt: new Date(),
    createdAt: new Date(),
    userId: 'userId1',
    id: 'projectId1',
    terminalId: 'terminalId1',
    editorOptionsId: 'editorOptionsId1',
    frameId: 'frameId1',
  } as unknown as ProjectCreateResponse);

  const result = await service.createNewProject('userId', data);

  assert.equal(result.name, 'new project');
});

test('findById -> should return project', async () => {
  const id = 'projectId1';
  const user: User = {
    id: 'userId1',
    email: 'email@example.it',
    createdAt: new Date(),
  };
  const {repository, service} = makeMockProjectService();

  const findByIdStub = vi.spyOn(repository, 'findById').mockResolvedValue({
    ...baseResponse,
    ownerId: 'userId1',
  });

  const result = await service.findById(user, id);

  expect(findByIdStub).toHaveBeenCalledWith(id);
  assert.ok(result.isOwner);
  assert.equal(result.ownerId, user.id);
  assert.equal(result.name, 'project1');
});

test('findById -> should return project and not owner', async () => {
  const id = 'projectId1';
  const user: User = {
    id: 'userId2',
    email: 'email@example.it',
    createdAt: new Date(),
  };
  const {repository, service} = makeMockProjectService();

  const findByIdStub = vi.spyOn(repository, 'findById').mockResolvedValue({
    ...baseResponse,
    ownerId: 'differentOwner',
    id: '1',
  } as ProjectGetByIdResponse);

  const result = await service.findById(user, id);

  expect(findByIdStub).toHaveBeenCalledWith(id);
  assert.notOk(result.isOwner);
  assert.equal(result.ownerId, 'differentOwner');
  assert.equal(result.name, 'project1');
});

test('findById -> should return 404 error when not found project', async () => {
  const id = 'projectId1';
  const user: User = {
    id: 'userId1',
    email: 'email@example.it',
    createdAt: new Date(),
  };
  const {repository, service} = makeMockProjectService();
  vi.spyOn(repository, 'findById').mockResolvedValue(null);

  await expect(service.findById(user, id), 'will reject').rejects.toThrow();
  await expect(service.findById(user, id)).rejects.toMatchObject({
    code: 'PROJECT_NOT_FOUND',
  });
});

test('clone -> should return cloned project', async () => {
  const {repository, service} = makeMockProjectService();
  vi.spyOn(repository, 'findById').mockResolvedValue({
    ...baseResponse,
    name: 'Existing',
    ownerId: 'userId1',
  });
  const user: User = {
    id: 'userId1',
    email: 'email@example.it',
    createdAt: new Date(),
  };

  const createNewProjectStub = vi
    .spyOn(service, 'createNewProject')
    .mockResolvedValue({
      ...baseResponse,
      id: baseResponse.id,
      name: 'Existing',
    });

  const result1 = await service.clone(user, 'projectId1', null);

  expect(createNewProjectStub).toHaveBeenCalledTimes(1);
  assert.equal(result1.name, 'Existing');

  vi.restoreAllMocks();

  vi.spyOn(repository, 'findById').mockResolvedValue({
    ...baseResponse,
    name: 'Existing',
    ownerId: 'userId1',
  });

  const createNewProjectStub2 = vi
    .spyOn(service, 'createNewProject')
    .mockResolvedValue({
      ...baseResponse,
      id: baseResponse.id,
      name: 'new name',
    });

  const result2 = await service.clone(user, 'projectId1', 'new name');
  assert.equal(result2.name, 'new name');
  expect(createNewProjectStub2).toHaveBeenCalledTimes(1);
});

test('clone -> should not wrap exception', async () => {
  const id = 'projectId1';
  const user: User = {
    id: 'userId1',
    email: 'email@example.it',
    createdAt: new Date(),
  };
  const {repository, service} = makeMockProjectService();

  const error = new Error('same exception');

  vi.spyOn(repository, 'findById').mockRejectedValue(error);

  await expect(service.clone(user, id, null)).rejects.toThrow(error);
});
