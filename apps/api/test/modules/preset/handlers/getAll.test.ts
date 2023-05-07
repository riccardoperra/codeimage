import {DomainHandlerMap, ResolvedDomainHandlerMap} from '@api/domain';
import * as sinon from 'sinon';
import {assert, beforeEach, test} from 'vitest';
import {findAll} from '../../../../src/modules/preset/handlers/findAll.js';
import {PresetHandlerDependencies} from '../../../../src/modules/preset/handlers/index.js';
import {PresetDto} from '../../../../src/modules/preset/schema/preset-dto.schema.js';
import {PresetTestDataUtils} from '../data-utils.js';
import {dependencies} from './dependencies.js';

const handlersStub = {} as ResolvedDomainHandlerMap<DomainHandlerMap>;

beforeEach(() => sinon.restore());

test('when findAll', async () => {
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
    data: {},
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

  assert.ok(findAllByOwnerIdStub.calledOnceWithExactly(ownerId));
  assert.ok(fromEntityToDtoStub.calledTwice);
  assert.equal(result.length, 2);
});
