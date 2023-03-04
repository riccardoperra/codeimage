import {Preset} from '@codeimage/prisma-models';

export type PresetCreateRequest = Pick<Preset, 'name' | 'data' | 'ownerId'>;
export type PresetUpdateRequest = Pick<Preset, 'name' | 'data'>;
export type PresetCreateResponse = Preset;
