import type {DomainHandlerMap, ResolvedDomainHandlerMap} from '@api/domain';
import type {Preset} from '@codeimage/prisma-models';
import {assert, beforeEach, expect, test, vi} from 'vitest';
import {create} from '../../../../src/modules/preset/handlers/create.js';
import type {PresetHandlerDependencies} from '../../../../src/modules/preset/handlers/index.js';
import type {PresetCreateDto} from '../../../../src/modules/preset/schema/preset-create-dto.schema.js';
import type {PresetDto} from '../../../../src/modules/preset/schema/preset-dto.schema.js';
import {testPresetUtils} from '../../../__internal__/presetUtils.js';
import {dependencies} from './dependencies.js';

const handlersStub = {} as ResolvedDomainHandlerMap<DomainHandlerMap>;

beforeEach(() => vi.restoreAllMocks());

test('when findById and found result', async () => {
  const id = 'preset-1';
  const ownerId = 'owner-1';

  const request: PresetCreateDto = {
    name: 'presetToCreate',
    data: testPresetUtils.buildPresetData(),
  };

  const savedPreset: Preset = {
    id,
    name: request.name,
    version: BigInt(1),
    createdAt: new Date(),
    updatedAt: new Date(),
    data: testPresetUtils.buildPresetData(),
    ownerId,
  };

  const expected: PresetDto = {
    id,
    name: request.name,
    version: 1,
    createdAt: savedPreset.createdAt,
    updatedAt: savedPreset.updatedAt,
    data: testPresetUtils.buildPresetData(),
  };

  vi.spyOn(dependencies.config, 'PRESETS_LIMIT', 'get').mockReturnValue(10);
  vi.spyOn(dependencies.repository, 'countByOwnerId').mockResolvedValue(0);

  const createStub = vi
    .spyOn(dependencies.repository, 'create')
    .mockResolvedValue(savedPreset);

  const fromEntityToDtoStub = vi
    .spyOn(dependencies.mapper, 'fromEntityToDto')
    .mockResolvedValue(expected);

  const result = await create(
    dependencies as unknown as PresetHandlerDependencies,
    {
      handlers: handlersStub,
    },
  )(ownerId, request);

  expect(createStub).toHaveBeenCalledTimes(1);
  expect(createStub).toHaveBeenCalledWith({
    ...request,
    version: BigInt(1),
    ownerId,
  });
  expect(fromEntityToDtoStub).toHaveBeenCalledTimes(1);
  expect(fromEntityToDtoStub).toHaveBeenCalledWith(savedPreset);

  assert.equal(result, expected);
});

test('throw error when exceed limit', async () => {
  const id = 'preset-1';
  const ownerId = 'owner-1';

  const request: PresetCreateDto = {
    name: 'presetToCreate',
    data: testPresetUtils.buildPresetData(),
  };

  const savedPreset: Preset = {
    id,
    name: request.name,
    version: BigInt(1),
    createdAt: new Date(),
    updatedAt: new Date(),
    data: testPresetUtils.buildPresetData(),
    ownerId,
  };

  vi.spyOn(dependencies.config, 'PRESETS_LIMIT', 'get').mockReturnValue(1);
  vi.spyOn(dependencies.repository, 'countByOwnerId').mockResolvedValue(10);

  const createStub = vi
    .spyOn(dependencies.repository, 'create')
    .mockResolvedValue(savedPreset);

  const fromEntityToDtoStub = vi.spyOn(dependencies.mapper, 'fromEntityToDto');

  await expect(
    create(dependencies as unknown as PresetHandlerDependencies, {
      handlers: handlersStub,
    })(ownerId, request),
  ).rejects.toThrow();

  expect(createStub).not.toHaveBeenCalled();
  expect(fromEntityToDtoStub).not.toHaveBeenCalled();
});
