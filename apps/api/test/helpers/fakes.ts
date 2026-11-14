import {randomUUID} from 'node:crypto';
import {Value} from '@sinclair/typebox/value';
import {PresetDataSchema} from '../../src/modules/preset/preset.contract.js';
import type {Preset} from '../../src/modules/preset/preset.model.js';
import type {PresetRepository} from '../../src/modules/preset/preset.repository.js';
import {asUserId, type Actor} from '../../src/shared/principal.js';

export const testActor = (id = 'alice'): Actor => ({
  kind: 'user',
  userId: asUserId(id),
  credential: {type: 'session'},
});
export const presetData = () => Value.Create(PresetDataSchema);

export function inMemoryPresets(seed: readonly Preset[] = []) {
  const rows = new Map(seed.map(row => [row.id, row]));
  const repository = {
    ownedBy(owner) {
      const get = async (id: string) => {
        const row = rows.get(id);
        return row?.ownerId === owner ? row : null;
      };
      return {
        get,
        list: async () =>
          [...rows.values()].filter(row => row.ownerId === owner),
        count: async () =>
          [...rows.values()].filter(row => row.ownerId === owner).length,
        create: async draft => {
          const row: Preset = {
            ...draft,
            id: randomUUID(),
            ownerId: owner,
            version: 1,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          rows.set(row.id, row);
          return row;
        },
        update: async (id, changes) => {
          const row = await get(id);
          if (!row) return null;
          const updated = {...row, ...changes, updatedAt: new Date()};
          rows.set(id, updated);
          return updated;
        },
        remove: async id => {
          const row = await get(id);
          if (row) rows.delete(id);
          return row;
        },
      };
    },
  } satisfies PresetRepository;
  return {...repository, all: () => [...rows.values()]};
}
