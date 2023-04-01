import {GetPresetByIdApi} from '@codeimage/api/api-types';

export type PresetsArray = Array<GetPresetByIdApi['response']>;
export type Preset = GetPresetByIdApi['response'];
