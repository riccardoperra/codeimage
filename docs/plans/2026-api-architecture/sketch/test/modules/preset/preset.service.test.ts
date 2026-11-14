/**
 * Unit tests for the preset use cases. No Fastify, no database, no mocks of internals: a real service
 * over an in-memory repository fake, asserting outcomes.
 *
 * Replaces test/modules/preset/handlers/*.test.ts, which built handlers with a fake HandlerRegistry,
 * spied on mapper.fromEntityToDto and cast dependencies through `unknown`.
 */
import {describe, expect, test} from 'vitest';
import {PresetErrors} from '../../../src/modules/preset/preset.model.js';
import {createPresetService} from '../../../src/modules/preset/preset.service.js';
import {inMemoryPresets, presetData, testActor} from '../../helpers/fakes.js';

const alice = testActor('alice');
const bob = testActor('bob');

describe('create', () => {
  test('stores the preset under the actor and returns it with version 1', async () => {
    const presets = inMemoryPresets();
    const service = createPresetService({presets, limit: 10});

    const created = await service.create(alice, {name: 'Dracula', data: presetData()});

    expect(created).toMatchObject({name: 'Dracula', ownerId: alice.userId, version: 1});
    expect(presets.all()).toHaveLength(1);
  });

  test('refuses with ExceedPresetLimitException once the account holds more than the limit', async () => {
    const presets = inMemoryPresets();
    const service = createPresetService({presets, limit: 1});
    await service.create(alice, {name: 'a', data: presetData()});
    // Preserved 2023 rule (Q2): strict comparison, so a second preset still passes at limit 1.
    await service.create(alice, {name: 'b', data: presetData()});

    await expect(
      service.create(alice, {name: 'c', data: presetData()}),
    ).rejects.toSatisfy(PresetErrors.limitExceeded.is);
    expect(presets.all()).toHaveLength(2);
  });

  test('counts only the actor’s presets', async () => {
    const presets = inMemoryPresets();
    const service = createPresetService({presets, limit: 1});
    await service.create(bob, {name: 'b1', data: presetData()});
    await service.create(bob, {name: 'b2', data: presetData()});

    await expect(
      service.create(alice, {name: 'a1', data: presetData()}),
    ).resolves.toMatchObject({ownerId: alice.userId});
  });

  test('a limit of 0 disables the check', async () => {
    const presets = inMemoryPresets();
    const service = createPresetService({presets, limit: 0});
    for (const name of ['a', 'b', 'c']) {
      await service.create(alice, {name, data: presetData()});
    }
    expect(presets.all()).toHaveLength(3);
  });
});

describe('update', () => {
  test("another user's preset is not found and stays unchanged", async () => {
    const presets = inMemoryPresets();
    const service = createPresetService({presets, limit: 10});
    const bobs = await service.create(bob, {name: 'mine', data: presetData()});

    await expect(
      service.update(alice, bobs.id, {name: 'stolen', data: {}}),
    ).rejects.toSatisfy(PresetErrors.notFound.is);
    expect(presets.all().find(p => p.id === bobs.id)?.name).toBe('mine');
  });
});
