import {Preset} from '@codeimage/prisma-models';
export type PresetCreateRequest = Pick<Preset, 'name' | 'data' | 'ownerId'>;
export type PresetCreateResponse = Preset;
