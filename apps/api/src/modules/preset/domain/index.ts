import {Preset} from '@codeimage/prisma-models';

export type PresetCreateRequest = Pick<
  Preset,
  'name' | 'data' | 'ownerId' | 'version'
>;

export type PresetUpdateRequest = Pick<Preset, 'name' | 'data'>;
