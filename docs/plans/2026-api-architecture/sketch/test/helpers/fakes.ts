/**
 * In-memory fakes for service unit tests. They implement the derived repository types, so a repository
 * change that the fake does not follow fails typecheck here, not silently in a test.
 *
 * Fakes keep state and honour the owner scope, so service tests assert outcomes ("the other user's
 * preset is still there") instead of call counts.
 */
import {Value} from '@sinclair/typebox/value';
import {PresetDataSchema} from '../../src/modules/preset/preset.contract.js';
import type {PresetData} from '../../src/modules/preset/preset.contract.js';
import type {Preset} from '../../src/modules/preset/preset.model.js';
import type {PresetRepository} from '../../src/modules/preset/preset.repository.js';
import {type Actor, asUserId} from '../../src/shared/principal.js';

/** An authenticated first-party user. */
export function testActor(userId = 'user-1'): Actor {
  return {kind: 'user', userId: asUserId(userId), credential: {type: 'session'}};
}

/** A valid PresetData built from the schema (replaces test/__internal__/presetUtils.ts). */
export function presetData(): PresetData {
  return Value.Create(PresetDataSchema);
}

export interface InMemoryPresets extends PresetRepository {
  /** Every stored preset, all owners. For assertions only. */
  all(): readonly Preset[];
}

export function inMemoryPresets(seed: readonly Preset[] = []): InMemoryPresets {
  // TODO: const rows = new Map(seed.map(p => [p.id, p]));
  //   ownedBy(owner) returns {get, list, count, create, update, remove} that filter rows by ownerId === owner;
  //   create assigns id = crypto.randomUUID(), version = 1, createdAt = updatedAt = new Date();
  //   update/remove return null for a missing or foreign id, exactly like the Prisma repository.
  //   Declared `satisfies PresetRepository` so it tracks the real factory's return type.
  void seed;
  throw new Error('not implemented');
}
