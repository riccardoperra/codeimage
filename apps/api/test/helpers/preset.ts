import {Value} from '@sinclair/typebox/value';
import {PresetDataSchema} from '../../src/modules/preset/preset.contract.js';

export const testPresetUtils = {
  buildPresetData() {
    return Value.Create(PresetDataSchema);
  },
};
