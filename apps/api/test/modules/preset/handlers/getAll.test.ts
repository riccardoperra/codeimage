import {DomainHandlerMap, ResolvedDomainHandlerMap} from '@api/domain';
import * as sinon from 'sinon';
import t from 'tap';
import {PresetHandlerDependencies} from '../../../../src/modules/preset/handlers';
import {findAll} from '../../../../src/modules/preset/handlers/findAll';
import {PresetMapper} from '../../../../src/modules/preset/mapper';
import {PresetRepository} from '../../../../src/modules/preset/repository';
import {PresetDto} from '../../../../src/modules/preset/schema/preset-dto.schema';
import {PresetTestDataUtils} from '../data-utils';

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

t.test('when findAll', async t => {
  const ownerId = 'owner-1';
  const preset1 = PresetTestDataUtils.buildPreset('id1', 'preset', ownerId);
  const preset2 = PresetTestDataUtils.buildPreset('id2', 'preset2', ownerId);

  const findAllByOwnerIdStub = sinon
    .stub(dependencies.repository, 'findAllByOwnerId')
    .resolves([preset1, preset2]);

  const expected1 = {
    id: preset1.id,
    name: preset1.name,
    version: Number(preset1.version),
    createdAt: preset1.createdAt,
    updatedAt: preset1.updatedAt,
  } as PresetDto;

  const fromEntityToDtoStub = sinon
    .stub(dependencies.mapper, 'fromEntityToDto')
    .resolves(expected1);

  const result = await findAll(
    dependencies as unknown as PresetHandlerDependencies,
    {
      handlers: handlersStub,
    },
  )(ownerId);

  t.ok(findAllByOwnerIdStub.calledOnceWithExactly(ownerId));
  t.ok(fromEntityToDtoStub.calledTwice);
  t.same(result.length, 2);
});
