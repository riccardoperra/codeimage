import {randomUUID} from 'node:crypto';
import {Value} from '@sinclair/typebox/value';
import {PresetDataSchema} from '../../src/modules/preset/preset.contract.js';
import type {Preset} from '../../src/modules/preset/preset.model.js';
import type {PresetRepository} from '../../src/modules/preset/preset.repository.js';
import {ownerScope, type OwnerScope} from '../../src/shared/db.js';
import {asUserId, type Actor, type UserId} from '../../src/shared/principal.js';
import {client} from './seed.js';

export const testActor = (id = 'alice'): Actor => ({
  kind: 'user',
  userId: asUserId(id),
  credential: {type: 'session'},
});
export const presetData = () => Value.Create(PresetDataSchema);
export const scopeFor = (userId: UserId) => ownerScope(client, userId);

export function inMemoryPresets(seed: readonly Preset[] = []) {
  const rows = new Map(seed.map(row => [row.id, row]));
  const getPreset = async (scope: OwnerScope, id: string) => {
    const row = rows.get(id);
    return row?.ownerId === scope.ownerId ? row : null;
  };
  const repository = {
    getPreset,
    listPresets: async scope =>
      [...rows.values()].filter(row => row.ownerId === scope.ownerId),
    countPresets: async scope =>
      [...rows.values()].filter(row => row.ownerId === scope.ownerId).length,
    createPreset: async (scope, draft) => {
      const row: Preset = {
        ...draft,
        id: randomUUID(),
        ownerId: scope.ownerId,
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      rows.set(row.id, row);
      return row;
    },
    updatePreset: async (scope, id, changes) => {
      const row = await getPreset(scope, id);
      if (!row) return null;
      const updated = {...row, ...changes, updatedAt: new Date()};
      rows.set(id, updated);
      return updated;
    },
    removePreset: async (scope, id) => {
      const row = await getPreset(scope, id);
      if (row) rows.delete(id);
      return row;
    },
  } satisfies PresetRepository;
  return {...repository, all: () => [...rows.values()]};
}
