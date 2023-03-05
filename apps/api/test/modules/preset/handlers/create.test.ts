import {DomainHandlerMap, ResolvedDomainHandlerMap} from '@api/domain';
import {Preset} from '@codeimage/prisma-models';
import * as sinon from 'sinon';
import t from 'tap';
import {PresetHandlerDependencies} from '../../../../src/modules/preset/handlers';
import {create} from '../../../../src/modules/preset/handlers/create';
import {PresetMapper} from '../../../../src/modules/preset/mapper';
import {PresetRepository} from '../../../../src/modules/preset/repository';
import {PresetCreateDto} from '../../../../src/modules/preset/schema/preset-create-dto.schema';
import {PresetDto} from '../../../../src/modules/preset/schema/preset-dto.schema';

const handlersStub = {} as ResolvedDomainHandlerMap<DomainHandlerMap>;

const dependencies = {
  mapper: {
    fromEntityToDto: () => void 0,
  } as unknown as PresetMapper,
  repository: {
    create: () => void 0,
    deletePreset: () => void 0,
    findByIdAndOwnerId: () => void 0,
    update: () => void 0,
    findAllByOwnerId: () => void 0,
  } as unknown as PresetRepository,
} as const;

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
  };

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
