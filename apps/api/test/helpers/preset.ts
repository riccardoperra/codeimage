import {Value} from '@sinclair/typebox/value';
import {PresetDataSchema} from '../../src/modules/preset/schema/preset-dto.schema.js';

export const testPresetUtils = {
  buildPresetData() {
    return Value.Create(PresetDataSchema);
  },
};
