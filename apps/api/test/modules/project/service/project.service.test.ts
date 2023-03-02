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
    internalServerError: (a: string) => ({message: a}),
    notFound: (a: string) => ({name: 'NotFoundError', message: a}),
    badGateway: (a: string) => ({message: a}),
    badRequest: (a: string) => ({message: a}),
    bandwidthLimitExceeded: (a: string) => ({message: a}),
    conflict: (a: string) => ({message: a}),
    createError: (a: string) => ({message: a}),
    expectationFailed: (a: string) => ({message: a}),
    failedDependency: (a: string) => ({message: a}),
    forbidden: (a: string) => ({message: a}),
    gatewayTimeout: (a: string) => ({message: a}),
    getHttpError: (a: string) => ({message: a}),
    gone: (a: string) => ({message: a}),
    HttpError: (a: string) => ({message: a}),
    httpVersionNotSupported: (a: string) => ({message: a}),
    imateapot: (a: string) => ({message: a}),
    insufficientStorage: (a: string) => ({message: a}),
    lengthRequired: (a: string) => ({message: a}),
    locked: (a: string) => ({message: a}),
    loopDetected: (a: string) => ({message: a}),
    methodNotAllowed: (a: string) => ({message: a}),
    misdirectedRequest: (a: string) => ({message: a}),
    networkAuthenticationRequired: (a: string) => ({message: a}),
    notAcceptable: (a: string) => ({message: a}),
    notExtended: (a: string) => ({message: a}),
    notImplemented: (a: string) => ({message: a}),
    payloadTooLarge: (a: string) => ({message: a}),
    paymentRequired: (a: string) => ({message: a}),
    preconditionFailed: (a: string) => ({message: a}),
    preconditionRequired: (a: string) => ({message: a}),
    proxyAuthenticationRequired: (a: string) => ({message: a}),
    rangeNotSatisfiable: (a: string) => ({message: a}),
    requestHeaderFieldsTooLarge: (a: string) => ({message: a}),
    requestTimeout: (a: string) => ({message: a}),
    serviceUnavailable: (a: string) => ({message: a}),
    tooEarly: (a: string) => ({message: a}),
    tooManyRequests: (a: string) => ({message: a}),
    unauthorized: (a: string) => ({message: a}),
    unavailableForLegalReasons: (a: string) => ({message: a}),
    unprocessableEntity: (a: string) => ({message: a}),
    unsupportedMediaType: (a: string) => ({message: a}),
    upgradeRequired: (a: string) => ({message: a}),
    uriTooLong: (a: string) => ({message: a}),
    variantAlsoNegotiates: (a: string) => ({message: a}),
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

t.test('clone -> should return cloned project', async t => {
  const {repository, service} = makeMockProjectService();
  sinon.stub(repository, 'findById').callsFake(async () => ({
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
    .stub(service, 'createNewProject')
    .resolves({
      ...baseResponse,
      id: baseResponse.id,
      name: 'Existing',
    });

  const result1 = await service.clone(user, 'projectId1', null);

  t.ok(createNewProjectStub.calledOnce);
  t.same(result1.name, 'Existing');

  sinon.restore();

  sinon.stub(repository, 'findById').callsFake(async () => ({
    ...baseResponse,
    name: 'Existing',
    ownerId: 'userId1',
  }));

  const createNewProjectStub2 = sinon
    .stub(service, 'createNewProject')
    .resolves({
      ...baseResponse,
      id: baseResponse.id,
      name: 'new name',
    });

  const result2 = await service.clone(user, 'projectId1', 'new name');
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
  const {repository, service, httpErrors} = makeMockProjectService();

  const error = new Error('same exception');

  sinon
    .stub(repository, 'findById')
    .callsFake(async () => Promise.reject(error));

  await t.rejects(service.clone(user, id, null), error);

  sinon.restore();

  sinon
    .stub(repository, 'findById')
    .callsFake(async () => Promise.reject(httpErrors.notFound('not found')));

  await t.rejects(service.clone(user, id, null), {
    message: `Cannot clone project with id ${id} since it does not exists`,
  });
});
