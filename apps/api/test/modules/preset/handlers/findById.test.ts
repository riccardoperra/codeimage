import {DomainHandlerMap, ResolvedDomainHandlerMap} from '@api/domain';
import {Preset} from '@codeimage/prisma-models';
import * as sinon from 'sinon';
import {assert, beforeEach, expect, test, vi} from 'vitest';
import {findById} from '../../../../src/modules/preset/handlers/findById.js';
import {PresetHandlerDependencies} from '../../../../src/modules/preset/handlers/index.js';
import {PresetDto} from '../../../../src/modules/preset/schema/preset-dto.schema.js';
import {PresetTestDataUtils} from '../data-utils.js';
import {dependencies} from './dependencies.js';

const handlersStub = {} as ResolvedDomainHandlerMap<DomainHandlerMap>;

beforeEach(() => sinon.restore());

test('when findById and found result', async () => {
  const id = 'preset-1';
  const ownerId = 'owner-1';
  const preset: Preset = PresetTestDataUtils.buildPreset(id, 'preset', ownerId);

  const findByIdStub = vi
    .spyOn(dependencies.repository, 'findByIdAndOwnerId')
    .mockResolvedValue(preset);

  const expected = {
    id: preset.id,
    name: preset.name,
    version: Number(preset.version),
    createdAt: preset.createdAt,
    updatedAt: preset.updatedAt,
    data: {},
  } as PresetDto;

  const fromEntityToDtoStub = vi
    .spyOn(dependencies.mapper, 'fromEntityToDto')
    .mockResolvedValue(expected);

  const result = await findById(
    dependencies as unknown as PresetHandlerDependencies,
    {
      handlers: handlersStub,
    },
  )(ownerId, id);

  expect(findByIdStub).toHaveBeenCalledWith(id, ownerId);
  expect(fromEntityToDtoStub).toHaveBeenCalledWith(preset);

  // TODO: why aren't we returning data here? we should put the v1-mapper logic to the mapper?
  assert.equal(result, expected);
});

test('when findById and return 0 result', async () => {
  const ownerId = 'owner-1';
  const id = 'preset-1';

  sinon
    .stub(dependencies.repository, 'findByIdAndOwnerId')
    .withArgs(id, ownerId)
    .returns(Promise.resolve(null));

  await expect(
    findById(dependencies as unknown as PresetHandlerDependencies, {
      handlers: handlersStub,
    })('ownerId', id),
  ).rejects.toThrow();
});
