import {Preset} from '@codeimage/prisma-models';
import {PresetCreateRequest, PresetUpdateRequest} from '../domain';

export interface PresetRepository {
  findByIdAndOwnerId(id: string, ownerId: string): Promise<Preset | null>;

  findAllByOwnerId(ownerId: string): Promise<readonly Preset[]>;

  create(data: PresetCreateRequest): Promise<Preset>;

  update(id: string, data: PresetUpdateRequest): Promise<Preset>;

  deletePreset(id: string): Promise<Preset>;
}
