/**
 * Preset persistence. Every query is scoped to one owner: `createPresetRepository(db)` exposes only
 * `ownedBy(owner)`, so neither a service nor anything else can read or write a preset without naming
 * whose it is. Writes key on the `id_ownerId` compound unique: one query, no find-then-write.
 *
 * Rows become domain Presets in `toPreset`. That is where today's PresetMapper logic lives now
 * (BigInt version to number, Json column to JsonObject). Prisma types do not leave this file.
 */
import type {Preset as PresetRow} from '@codeimage/prisma-models';
import {type Db, orNull} from '../../shared/db.js';
import {asUserId, type UserId} from '../../shared/principal.js';
import type {Preset, PresetChanges, PresetDraft} from './preset.model.js';

export function createPresetRepository(db: Db) {
  return {
    ownedBy(owner: UserId) {
      const ownedId = (id: string) => ({id_ownerId: {id, ownerId: owner}});

      return {
        async get(id: string): Promise<Preset | null> {
          const row = await db.preset.findUnique({where: ownedId(id)});
          return row ? toPreset(row) : null;
        },

        async list(): Promise<Preset[]> {
          const rows = await db.preset.findMany({where: {ownerId: owner}});
          return rows.map(toPreset);
        },

        count(): Promise<number> {
          return db.preset.count({where: {ownerId: owner}});
        },

        /** `version` is left to the DB default (1), as today. */
        async create(draft: PresetDraft): Promise<Preset> {
          const row = await db.preset.create({
            data: {
              name: draft.name,
              data: draft.data,
              owner: {connect: {id: owner}},
            },
          });
          return toPreset(row);
        },

        /** null when the preset does not exist or belongs to someone else. */
        async update(id: string, changes: PresetChanges): Promise<Preset | null> {
          const row = await orNull(
            db.preset.update({
              where: ownedId(id),
              data: {name: changes.name, data: changes.data},
            }),
          );
          return row ? toPreset(row) : null;
        },

        /** null when the preset does not exist or belongs to someone else. */
        async remove(id: string): Promise<Preset | null> {
          const row = await orNull(db.preset.delete({where: ownedId(id)}));
          return row ? toPreset(row) : null;
        },
      };
    },
  };
}

/** Derived, not hand-written: tests fake it with `satisfies PresetRepository`. */
export type PresetRepository = ReturnType<typeof createPresetRepository>;
export type OwnedPresets = ReturnType<PresetRepository['ownedBy']>;

/** Row to domain. Parses the Json column instead of asserting its type. */
function toPreset(row: PresetRow): Preset {
  const data = row.data;
  // Both write paths only accept a JSON object (create: PresetDataSchema, update: Type.Object({})),
  // so anything else is a corrupt row, not a client error.
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
