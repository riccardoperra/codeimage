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

  const create = async (ownerId: string, data: PresetCreateRequest) => {
    return client.preset.create({
      data: {
        name: data.name,
        owner: {
          connect: {id: ownerId},
        },
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        data: data.data,
      },
    });
  };
  return {
    findById,
    create,
  };
};
