import {randomUUID} from 'node:crypto';
import {Value} from '@sinclair/typebox/value';
import {PresetDataSchema} from '../../src/modules/preset/preset.contract.js';
import type {Preset} from '../../src/modules/preset/preset.model.js';
import type {PresetRepository} from '../../src/modules/preset/preset.repository.js';
import type {Signature} from '../../src/modules/signature/signature.model.js';
import type {SignatureRepository} from '../../src/modules/signature/signature.repository.js';
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

export const signatureData = () => ({
  handle: '@octocat',
  position: 'bottom-right' as const,
  style: 'card' as const,
  platform: 'github' as const,
  name: 'The Octocat',
  avatar: 'profile',
  profile: null,
});

export function inMemorySignatures(seed: readonly Signature[] = []) {
  const rows = new Map(seed.map(row => [row.id, row]));
  const getSignature = async (scope: OwnerScope, id: string) => {
    const row = rows.get(id);
    return row?.ownerId === scope.ownerId ? row : null;
  };
  const clearDefault = (scope: OwnerScope, except?: string) => {
    for (const row of rows.values())
      if (row.ownerId === scope.ownerId && row.id !== except && row.isDefault)
        rows.set(row.id, {...row, isDefault: false});
  };
  const repository = {
    getSignature,
    listSignatures: async scope =>
      [...rows.values()].filter(row => row.ownerId === scope.ownerId),
    countSignatures: async scope =>
      [...rows.values()].filter(row => row.ownerId === scope.ownerId).length,
    createSignature: async (scope, draft) => {
      if (draft.isDefault) clearDefault(scope);
      const row: Signature = {
        name: draft.name,
        data: draft.data,
        isDefault: draft.isDefault ?? false,
        id: randomUUID(),
        ownerId: scope.ownerId,
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      rows.set(row.id, row);
      return row;
    },
    updateSignature: async (scope, id, changes) => {
      const row = await getSignature(scope, id);
      if (!row) return null;
      if (changes.isDefault) clearDefault(scope, id);
      const updated: Signature = {
        ...row,
        name: changes.name ?? row.name,
        data: changes.data ?? row.data,
        isDefault: changes.isDefault ?? row.isDefault,
        version: row.version + 1,
        updatedAt: new Date(),
      };
      rows.set(id, updated);
      return updated;
    },
    removeSignature: async (scope, id) => {
      const row = await getSignature(scope, id);
      if (row) rows.delete(id);
      return row;
    },
  } satisfies SignatureRepository;
  return {...repository, all: () => [...rows.values()]};
}
