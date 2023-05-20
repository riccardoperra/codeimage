import {Preset, PrismaClient} from '@codeimage/prisma-models';
import {PresetCreateRequest} from '../domain/index.js';
import {PresetRepository} from './index.js';

export class PrismaPresetRepository implements PresetRepository {
  constructor(private readonly client: PrismaClient) {}

  create(data: PresetCreateRequest): Promise<Preset> {
    return this.client.preset.create({
      data: {
        name: data.name,
        owner: {
          connect: {id: data.ownerId},
        },
        data: data.data ?? {},
      },
    });
  }

  deletePreset(id: string): Promise<Preset> {
    return this.client.preset.delete({
      where: {
        id,
      },
    });
  }

  findByIdAndOwnerId(id: string, ownerId: string): Promise<Preset | null> {
    return this.client.preset.findUnique({
      where: {
        id_ownerId: {
          id,
          ownerId,
        },
      },
    });
  }

  findAllByOwnerId(ownerId: string): Promise<Preset[]> {
    return this.client.preset.findMany({
      where: {
        ownerId,
      },
    });
  }

  countByOwnerId(ownerId: string): Promise<number> {
    return this.client.preset.count({where: {ownerId}});
  }

  update(id: string, data: PresetCreateRequest): Promise<Preset> {
    return this.client.preset.update({
      where: {
        id,
      },
      data: {
        name: data.name,
        data: data.data ?? {},
      },
    });
  }
}
