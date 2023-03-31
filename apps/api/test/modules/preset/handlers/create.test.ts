import {DomainHandlerMap, ResolvedDomainHandlerMap} from '@api/domain';
import {Preset} from '@codeimage/prisma-models';
import * as sinon from 'sinon';
import t from 'tap';
import {PresetHandlerDependencies} from '../../../../src/modules/preset/handlers';
import {create} from '../../../../src/modules/preset/handlers/create';
import {PresetCreateDto} from '../../../../src/modules/preset/schema/preset-create-dto.schema';
import {PresetDto} from '../../../../src/modules/preset/schema/preset-dto.schema';
import {dependencies} from './dependencies';

const handlersStub = {} as ResolvedDomainHandlerMap<DomainHandlerMap>;

t.beforeEach(() => sinon.restore());

t.test('when findById and found result', async t => {
  const id = 'preset-1';
  const ownerId = 'owner-1';

  const request: PresetCreateDto = {
    name: 'presetToCreate',
    data: {test: true},
  };

  const savedPreset: Preset = {
    id,
    name: request.name,
    version: BigInt(1),
    createdAt: new Date(),
    updatedAt: new Date(),
    data: {test: true},
    ownerId,
  };

  const expected: PresetDto = {
    id,
    name: request.name,
    version: 1,
    createdAt: savedPreset.createdAt,
    updatedAt: savedPreset.updatedAt,
    data: {test: true},
  };

  sinon.stub(dependencies.config, 'PRESETS_LIMIT').value(10);
  sinon.stub(dependencies.repository, 'countByOwnerId').resolves(0);

  const createStub = sinon
    .stub(dependencies.repository, 'create')
    .resolves(savedPreset);

  const fromEntityToDtoStub = sinon
    .stub(dependencies.mapper, 'fromEntityToDto')
    .resolves(expected);

  const result = await create(
    dependencies as unknown as PresetHandlerDependencies,
    {
      handlers: handlersStub,
    },
  )(ownerId, request);

  t.ok(
    createStub.calledOnceWithExactly({...request, version: BigInt(1), ownerId}),
  );
  t.ok(fromEntityToDtoStub.calledOnceWithExactly(savedPreset));

  t.equal(result, expected);
});

t.test('throw error when exceed limit', async t => {
  const id = 'preset-1';
  const ownerId = 'owner-1';

  const request: PresetCreateDto = {
    name: 'presetToCreate',
    data: {test: true},
  };

  const savedPreset: Preset = {
    id,
    name: request.name,
    version: BigInt(1),
    createdAt: new Date(),
    updatedAt: new Date(),
    data: {test: true},
    ownerId,
  };

  sinon.stub(dependencies.config, 'PRESETS_LIMIT').value(1);
  sinon.stub(dependencies.repository, 'countByOwnerId').resolves(10);

  const createStub = sinon
    .stub(dependencies.repository, 'create')
    .resolves(savedPreset);

  const fromEntityToDtoStub = sinon.stub(
    dependencies.mapper,
    'fromEntityToDto',
  );

  await t.rejects(
    create(dependencies as unknown as PresetHandlerDependencies, {
      handlers: handlersStub,
    })(ownerId, request),
  );

  t.ok(createStub.notCalled);
  t.ok(fromEntityToDtoStub.notCalled);
});
