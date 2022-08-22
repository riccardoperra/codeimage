import {User} from '@codeimage/prisma-models';
import {HttpErrors} from '@fastify/sensible/lib/httpError';
import * as sinon from 'sinon';
import t from 'tap';
import {
  ProjectCreateResponse,
  ProjectGetByIdResponse,
} from '../../../../src/modules/project/domain';
import {makeProjectService} from '../../../../src/modules/project/handlers/project.service';
import {ProjectRepository} from '../../../../src/modules/project/repository';

export function makeMockProjectService() {
  const repository = {
    findById: () => void 0,
    findByUserId: () => void 0,
    create: () => void 0,
    createNewProject: () => void 0,
    update: () => void 0,
    delete: () => void 0,
  } as unknown as ProjectRepository;

  const httpErrors = {
    internalServerError: () => void 0,
    notFound: () => void 0,
    badGateway: () => void 0,
    badRequest: () => void 0,
    bandwidthLimitExceeded: () => void 0,
    conflict: () => void 0,
    createError: () => void 0,
    expectationFailed: () => void 0,
    failedDependency: () => void 0,
    forbidden: () => void 0,
    gatewayTimeout: () => void 0,
    getHttpError: () => void 0,
    gone: () => void 0,
    HttpError: () => void 0,
    httpVersionNotSupported: () => void 0,
    imateapot: () => void 0,
    insufficientStorage: () => void 0,
    lengthRequired: () => void 0,
    locked: () => void 0,
    loopDetected: () => void 0,
    methodNotAllowed: () => void 0,
    misdirectedRequest: () => void 0,
    networkAuthenticationRequired: () => void 0,
    notAcceptable: () => void 0,
    notExtended: () => void 0,
    notImplemented: () => void 0,
    payloadTooLarge: () => void 0,
    paymentRequired: () => void 0,
    preconditionFailed: () => void 0,
    preconditionRequired: () => void 0,
    proxyAuthenticationRequired: () => void 0,
    rangeNotSatisfiable: () => void 0,
    requestHeaderFieldsTooLarge: () => void 0,
    requestTimeout: () => void 0,
    serviceUnavailable: () => void 0,
    tooEarly: () => void 0,
    tooManyRequests: () => void 0,
    unauthorized: () => void 0,
    unavailableForLegalReasons: () => void 0,
    unprocessableEntity: () => void 0,
    unsupportedMediaType: () => void 0,
    upgradeRequired: () => void 0,
    uriTooLong: () => void 0,
    variantAlsoNegotiates: () => void 0,
  } as unknown as HttpErrors;

  return {
    service: makeProjectService(repository, httpErrors),
    repository,
    httpErrors,
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

t.beforeEach(() => sinon.reset());

t.test('create project', async t => {
  const {repository, service} = makeMockProjectService();
  const data = {
    name: 'new project',
    editorOptions: {
      fontId: 'fontId',
      fontWeight: 300,
      showLineNumbers: true,
      themeId: 'themeId',
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

  sinon.stub(repository, 'createNewProject').resolves({
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

  t.strictSame(result.name, 'new project');
});

t.test('findById -> should return project', async t => {
  const id = 'projectId1';
  const user: User = {
    id: 'userId1',
    email: 'email@example.it',
    createdAt: new Date(),
  };
  const {repository, service} = makeMockProjectService();

  sinon
    .stub(repository, 'findById')
    .withArgs(id)
    .callsFake(() =>
      Promise.resolve({
        ...baseResponse,
        ownerId: 'userId1',
      }),
    );

  const result = await service.findById(user, id);

  t.ok(result.isOwner);
  t.same(result.ownerId, user.id);
  t.same(result.name, 'project1');
});

t.test('findById -> should return project and not owner', async t => {
  const id = 'projectId1';
  const user: User = {
    id: 'userId2',
    email: 'email@example.it',
    createdAt: new Date(),
  };
  const {repository, service} = makeMockProjectService();

  sinon
    .stub(repository, 'findById')
    .withArgs(id)
    .callsFake(() =>
      Promise.resolve({
        ...baseResponse,
        ownerId: 'differentOwner',
        id: '1',
      } as ProjectGetByIdResponse),
    );

  const result = await service.findById(user, id);

  t.notOk(result.isOwner);
  t.same(result.ownerId, 'differentOwner');
  t.same(result.name, 'project1');
});

t.test(
  'findById -> should return 404 error when not found project',
  async t => {
    const id = 'projectId1';
    const user: User = {
      id: 'userId1',
      email: 'email@example.it',
      createdAt: new Date(),
    };
    const {repository, service, httpErrors} = makeMockProjectService();
    const notFoundSpy = sinon.spy(httpErrors, 'notFound');
    sinon.stub(repository, 'findById').callsFake(async () => null);

    await t.rejects(service.findById(user, id), 'will reject');
    t.ok(notFoundSpy.called, 'called not found spy');
  },
);

t.test('clone -> should return created project', async t => {
  const {repository, service} = makeMockProjectService();
  sinon.stub(repository, 'findById').callsFake(async () => ({
    ...baseResponse,
    ownerId: 'userId1',
  }));

  const createNewProjectSpy = sinon.spy(service, 'createNewProject');

  t.ok(createNewProjectSpy.calledOnce);
});

t.test(
  'findById -> should return 404 error when not found project',
  async t => {
    const id = 'projectId1';
    const user: User = {
      id: 'userId1',
      email: 'email@example.it',
      createdAt: new Date(),
    };
    const {repository, service, httpErrors} = makeMockProjectService();
    const notFoundSpy = sinon.spy(httpErrors, 'notFound');
    sinon.stub(repository, 'findById').callsFake(async () => null);

    await t.rejects(service.findById(user, id), 'will reject');
    t.ok(notFoundSpy.called, 'called not found spy');
  },
);
