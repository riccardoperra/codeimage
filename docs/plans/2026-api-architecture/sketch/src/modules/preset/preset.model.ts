/**
 * The preset domain: types, the limit rule, the error catalog. No I/O, no Fastify, no Prisma.
 * Replaces modules/preset/{domain,exceptions}/ and the `PresetHandlerDependencies` type.
 */
import {defineErrors} from '../../shared/errors.js';
import type {UserId} from '../../shared/principal.js';
import type {PresetData} from './preset.contract.js';

export type JsonValue =
  | string
  | number
  | boolean
  | null
  | readonly JsonValue[]
  | JsonObject;

/** Keys are optional so the Prisma Json column's object type is assignable without a cast. */
export type JsonObject = {readonly [key in string]?: JsonValue};

export interface Preset {
  readonly id: string;
  readonly ownerId: UserId;
  readonly name: string;
  /** A BigInt column in Postgres; a number everywhere else (repository converts). */
  readonly version: number;
  /**
   * Any JSON object. Create validates the body against PresetDataSchema, but update accepts any
   * object (Q3), so a stored preset is not guaranteed to be PresetData. The type says so.
   */
  readonly data: JsonObject;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

/** What create needs. The owner is not part of it: the repository handle carries the owner. */
export interface PresetDraft {
  readonly name: string;
  readonly data: PresetData;
}

/** What update writes. `data` is any JSON object because the update contract does not validate it (Q3). */
export interface PresetChanges {
  readonly name: string;
  readonly data: JsonObject;
}

export const PresetErrors = defineErrors({
  /** Code and message frozen: test/routes/v1/preset/{getById,update}.integration.test.ts assert both. */
  notFound: {
    code: 'NotFoundPresetException',
    kind: 'not_found',
    message: (p: {id: string; ownerId: UserId}) =>
      `Preset with id ${p.id} for user ${p.ownerId} not found`,
  },
  /** Code frozen (today's class name); status 422 and message unchanged. */
  limitExceeded: {
    code: 'ExceedPresetLimitException',
    kind: 'unprocessable',
    message: (_: {limit: number}) => 'Preset limit per account exceeded',
  },
});

/**
 * Whether an account that already holds `existing` presets may NOT create one more.
 *
 * Preserves the 2023 rule exactly (`config.PRESETS_LIMIT && count > PRESETS_LIMIT`):
 * - a limit of 0 disables the check;
 * - the comparison is strict, so an account can reach `limit + 1` presets.
 * Whether to change it is open question Q2. test/modules/preset/preset.service.test.ts pins the boundary,
 * so a change is a deliberate one-line edit plus a test edit, never an accident.
 */
export function exceedsPresetLimit(existing: number, limit: number): boolean {
  return limit !== 0 && existing > limit;
}
