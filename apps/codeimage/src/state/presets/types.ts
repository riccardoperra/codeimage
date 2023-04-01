import {GetPresetByIdApi} from '@codeimage/api/api-types';
import {PresetData} from '@codeimage/store/presets/bridge';

export type PresetsArray = Array<GetPresetByIdApi['response']>;
export type Preset = GetPresetByIdApi['response'] & {
  data: PresetData;
};
