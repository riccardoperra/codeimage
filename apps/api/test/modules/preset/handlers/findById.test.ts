import {DomainHandlerMap, ResolvedDomainHandlerMap} from '@api/domain';
import {Preset} from '@codeimage/prisma-models';
import * as sinon from 'sinon';
import t from 'tap';
import {PresetHandlerDependencies} from '../../../../src/modules/preset/handlers';
import {findById} from '../../../../src/modules/preset/handlers/findById';
import {PresetDto} from '../../../../src/modules/preset/schema/preset-dto.schema';
import {PresetTestDataUtils} from '../data-utils';
import {dependencies} from './dependencies';

const handlersStub = {} as ResolvedDomainHandlerMap<DomainHandlerMap>;

t.beforeEach(() => sinon.restore());

t.test('when findById and found result', async t => {
  const id = 'preset-1';
  const ownerId = 'owner-1';
  const preset: Preset = PresetTestDataUtils.buildPreset(id, 'preset', ownerId);

  const findByIdStub = sinon
    .stub(dependencies.repository, 'findByIdAndOwnerId')
    .resolves(preset);

  const expected = {
    id: preset.id,
    name: preset.name,
    version: Number(preset.version),
    createdAt: preset.createdAt,
    updatedAt: preset.updatedAt,
    data: {},
  } as PresetDto;

  const fromEntityToDtoStub = sinon
    .stub(dependencies.mapper, 'fromEntityToDto')
    .resolves(expected);

  const result = await findById(
    dependencies as unknown as PresetHandlerDependencies,
    {
      handlers: handlersStub,
    },
  )(ownerId, id);

  t.ok(findByIdStub.calledOnceWithExactly(id, ownerId));
  t.ok(fromEntityToDtoStub.calledOnceWithExactly(preset));

  // TODO: why aren't we returning data here? we should put the v1-mapper logic to the mapper?
  t.equal(result, expected);
});

t.test('when findById and return 0 result', async t => {
  const ownerId = 'owner-1';
  const id = 'preset-1';

  sinon
    .stub(dependencies.repository, 'findByIdAndOwnerId')
    .withArgs(id, ownerId)
    .returns(Promise.resolve(null));

  await t.rejects(() =>
    findById(dependencies as unknown as PresetHandlerDependencies, {
      handlers: handlersStub,
    })('ownerId', id),
  );
});
