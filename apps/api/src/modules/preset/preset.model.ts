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

export type JsonObject = {readonly [key in string]?: JsonValue};

export interface Preset {
  readonly id: string;
  readonly ownerId: UserId;
  readonly name: string;
  readonly version: number;
  readonly data: JsonObject;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface PresetDraft {
  readonly name: string;
  readonly data: PresetData;
}

export interface PresetChanges {
  readonly name: string;
  readonly data: JsonObject;
}

export const PresetErrors = defineErrors({
  notFound: {
    code: 'NotFoundPresetException',
    kind: 'not_found',
    message: (p: {id: string; ownerId: UserId}) =>
      `Preset with id ${p.id} for user ${p.ownerId} not found`,
  },
  limitExceeded: {
    code: 'ExceedPresetLimitException',
    kind: 'unprocessable',
    message: (_: {limit: number}) => 'Preset limit per account exceeded',
  },
});

export function exceedsPresetLimit(existing: number, limit: number): boolean {
  return limit !== 0 && existing > limit;
}
