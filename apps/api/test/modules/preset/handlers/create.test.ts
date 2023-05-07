import {DomainHandlerMap, ResolvedDomainHandlerMap} from '@api/domain';
import {Preset} from '@codeimage/prisma-models';
import * as sinon from 'sinon';
import {assert, beforeEach, expect, test} from 'vitest';
import {create} from '../../../../src/modules/preset/handlers/create.js';
import {PresetHandlerDependencies} from '../../../../src/modules/preset/handlers/index.js';
import {PresetCreateDto} from '../../../../src/modules/preset/schema/preset-create-dto.schema.js';
import {PresetDto} from '../../../../src/modules/preset/schema/preset-dto.schema.js';
import {testPresetUtils} from '../../../__internal__/presetUtils.js';
import {dependencies} from './dependencies.js';

const handlersStub = {} as ResolvedDomainHandlerMap<DomainHandlerMap>;

beforeEach(() => sinon.restore());

test('when findById and found result', async t => {
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

  assert.ok(
    createStub.calledOnceWithExactly({...request, version: BigInt(1), ownerId}),
  );
  assert.ok(fromEntityToDtoStub.calledOnceWithExactly(savedPreset));

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

  sinon.stub(dependencies.config, 'PRESETS_LIMIT').value(1);
  sinon.stub(dependencies.repository, 'countByOwnerId').resolves(10);

  const createStub = sinon
    .stub(dependencies.repository, 'create')
    .resolves(savedPreset);

  const fromEntityToDtoStub = sinon.stub(
    dependencies.mapper,
    'fromEntityToDto',
  );

  await expect(
    create(dependencies as unknown as PresetHandlerDependencies, {
      handlers: handlersStub,
    })(ownerId, request),
  ).rejects.toThrow();

  assert.ok(createStub.notCalled);
  assert.ok(fromEntityToDtoStub.notCalled);
});
