import {Preset} from '@codeimage/prisma-models';
import {PresetDto} from '../schema/preset-dto.schema';

export interface PresetMapper {
  fromEntityToDto(entity: Preset): PresetDto;
}

export class PresetMapper implements PresetMapper {
  fromEntityToDto(entity: Preset): PresetDto {
    return {
      id: entity.id,
      name: entity.name,
      version: entity.version,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    } as const;
  }
}
