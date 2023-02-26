import {PresetCreateRequest} from './../../domain/index';
import {PrismaClient} from '@codeimage/prisma-models/*';
import {PresetRepository} from '../../repository';

export const makePrismaPresetRepository = (
  client: PrismaClient,
): PresetRepository => {
  const findById = async (id: string) => {
    return client.preset.findFirst({
      where: {
        id,
      },
    });
  };

  const create = async (data: PresetCreateRequest) => {
    return client.preset.create({
      data: {
        name: data.name,
        owner: {
          connect: {id: data.ownerId},
        },
        data: data.data ?? {},
      },
    });
  };

  const update = async (id: string, data: PresetCreateRequest) => {
    return client.preset.update({
      where: {
        id,
      },
      data: {
        name: data.name,
        data: data.data ?? {},
      },
    });
  };
  const deletePreset = async (id: string) => {
    return client.preset.delete({
      where: {
        id,
      },
    });
  };
  return {
    findById,
    create,
    update,
    deletePreset,
  };
};
