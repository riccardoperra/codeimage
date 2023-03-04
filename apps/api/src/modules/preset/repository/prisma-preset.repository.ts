import {Preset, PrismaClient} from '@codeimage/prisma-models/*';
import {PresetCreateRequest, PresetCreateResponse} from '../domain';
import {PresetRepository} from './index';

export class PrismaPresetRepository implements PresetRepository {
  constructor(private readonly client: PrismaClient) {}

  create(data: PresetCreateRequest): Promise<PresetCreateResponse> {
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

  deletePreset(id: string): Promise<PresetCreateResponse> {
    return this.client.preset.delete({
      where: {
        id,
      },
    });
  }

  findById(id: string): Promise<Preset | null> {
    return this.client.preset.findUnique({
      where: {
        id,
      },
    });
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
