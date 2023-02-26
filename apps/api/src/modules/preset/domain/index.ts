import {Preset} from '@codeimage/prisma-models';
export type PresetCreateRequest = Pick<Preset, 'name' | 'data'>;
export type PresetCreateResponse = Preset;
