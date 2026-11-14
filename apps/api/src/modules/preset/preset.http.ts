import {Value} from '@sinclair/typebox/value';
import {PresetDataSchema, type PresetResponse} from './preset.contract.js';
import type {Preset} from './preset.model.js';

export function toPresetResponse(preset: Preset): PresetResponse {
  const {data} = preset;
  if (!Value.Check(PresetDataSchema, data)) {
    throw new Error(
      `Preset ${preset.id}: stored data does not match PresetDataSchema`,
    );
  }
  return {
    id: preset.id,
    name: preset.name,
    createdAt: preset.createdAt,
    updatedAt: preset.updatedAt,
    version: preset.version,
    data,
  };
}
