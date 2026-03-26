import type {DomainHandlerMap, ResolvedDomainHandlerMap} from '@api/domain';
import {assert, beforeEach, expect, test, vi} from 'vitest';
import {findAll} from '../../../../src/modules/preset/handlers/findAll.js';
import type {PresetHandlerDependencies} from '../../../../src/modules/preset/handlers/index.js';
import type {PresetDto} from '../../../../src/modules/preset/schema/preset-dto.schema.js';
import {PresetTestDataUtils} from '../data-utils.js';
import {dependencies} from './dependencies.js';

const handlersStub = {} as ResolvedDomainHandlerMap<DomainHandlerMap>;

beforeEach(() => vi.restoreAllMocks());

test('when findAll', async () => {
  const ownerId = 'owner-1';
  const preset1 = PresetTestDataUtils.buildPreset('id1', 'preset', ownerId);
  const preset2 = PresetTestDataUtils.buildPreset('id2', 'preset2', ownerId);

  const findAllByOwnerIdStub = vi
    .spyOn(dependencies.repository, 'findAllByOwnerId')
    .mockResolvedValue([preset1, preset2]);

  const expected1 = {
    id: preset1.id,
    name: preset1.name,
    version: Number(preset1.version),
    createdAt: preset1.createdAt,
    updatedAt: preset1.updatedAt,
    data: {},
  } as PresetDto;

  const fromEntityToDtoStub = vi
    .spyOn(dependencies.mapper, 'fromEntityToDto')
    .mockResolvedValue(expected1);

  const result = await findAll(
    dependencies as unknown as PresetHandlerDependencies,
    {
      handlers: handlersStub,
    },
  )(ownerId);

  expect(findAllByOwnerIdStub).toHaveBeenCalledTimes(1);
  expect(findAllByOwnerIdStub).toHaveBeenCalledWith(ownerId);
  expect(fromEntityToDtoStub).toHaveBeenCalledTimes(2);
  assert.equal(result.length, 2);
});
