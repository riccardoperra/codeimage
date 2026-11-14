import type * as repository from './preset.repository.js';
import type {Preset as PresetRow} from '@codeimage/prisma-models';
import {type OwnerScope, orNull} from '../../shared/db.js';
import {asUserId, type UserId} from '../../shared/principal.js';
import type {Preset, PresetChanges, PresetDraft} from './preset.model.js';

export async function getPreset(
  scope: OwnerScope,
  id: string,
): Promise<Preset | null> {
  const row = await scope.client.preset.findUnique({
    where: {id_ownerId: {id, ownerId: scope.ownerId}},
  });
  return row ? toPreset(row) : null;
}

export async function listPresets(scope: OwnerScope): Promise<Preset[]> {
  const rows = await scope.client.preset.findMany({
    where: {ownerId: scope.ownerId},
  });
  return rows.map(toPreset);
}

export function countPresets(scope: OwnerScope): Promise<number> {
  return scope.client.preset.count({where: {ownerId: scope.ownerId}});
}

export async function createPreset(
  scope: OwnerScope,
  draft: PresetDraft,
): Promise<Preset> {
  const row = await scope.client.preset.create({
    data: {
      name: draft.name,
      data: draft.data,
      owner: {connect: {id: scope.ownerId}},
    },
  });
  return toPreset(row);
}

export async function updatePreset(
  scope: OwnerScope,
  id: string,
  changes: PresetChanges,
): Promise<Preset | null> {
  const row = await orNull(
    scope.client.preset.update({
      where: {id_ownerId: {id, ownerId: scope.ownerId}},
      data: {name: changes.name, data: changes.data},
    }),
  );
  return row ? toPreset(row) : null;
}

export async function removePreset(
  scope: OwnerScope,
  id: string,
): Promise<Preset | null> {
  const row = await orNull(
    scope.client.preset.delete({
      where: {id_ownerId: {id, ownerId: scope.ownerId}},
    }),
  );
  return row ? toPreset(row) : null;
}

export type PresetRepository = typeof repository;

export interface PresetDependencies {
  readonly presets: PresetRepository;
  readonly scopeFor: (userId: UserId) => OwnerScope;
}

function toPreset(row: PresetRow): Preset {
  const data = row.data;
  if (typeof data !== 'object' || data === null || Array.isArray(data)) {
    throw new Error(`Preset ${row.id}: data column is not a JSON object`);
  }
  return {
    id: row.id,
    ownerId: asUserId(row.ownerId),
    name: row.name,
    version: Number(row.version),
    data,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}
