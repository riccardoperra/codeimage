import {Preset} from '@codeimage/prisma-models';
import {PresetCreateRequest, PresetCreateResponse} from '../domain';

export interface PresetRepository {
  findById(id: string): Promise<Preset | null>;

  create(data: PresetCreateRequest): Promise<PresetCreateResponse>;

  update(id: string, data: PresetCreateRequest): Promise<Preset>;

  deletePreset(id: string): Promise<Preset>;
}
