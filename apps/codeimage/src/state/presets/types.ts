import {GetPresetByIdApi} from '@codeimage/api/api-types';

export type ApiPreset = GetPresetByIdApi['response'];
export type PresetData = ApiPreset['data'];

export type Preset = Omit<ApiPreset, 'data'> & {
  data: PresetData;
};

export type PresetsArray = Array<Preset>;
