import {HttpErrors} from '@fastify/sensible/lib/httpError';
import {PresetCreateRequest, PresetCreateResponse} from '../domain';
import {PresetRepository} from '../repository';
export interface PresetService {
  findById(ownerId: string, id: string): Promise<PresetCreateResponse>;
  create(
    userId: string,
    data: PresetCreateRequest,
  ): Promise<PresetCreateResponse>;
  update: (
    userId: string,
    id: string,
    data: PresetCreateRequest,
  ) => Promise<PresetCreateResponse>;
  deletePreset: (userId: string, id: string) => Promise<PresetCreateResponse>;
}
export const makePresetService = (
  repository: PresetRepository,
  httpErrors: HttpErrors,
): PresetService => {
  const findById = async (
    ownerId: string,
    id: string,
  ): Promise<PresetCreateResponse> => {
    const preset = await repository.findById(id);
    if (!preset) {
      throw httpErrors.notFound(`Preset with id ${id} not found`);
    }
    if (preset.ownerId !== ownerId) {
      throw httpErrors.forbidden('You are not allowed to access this preset');
    }

    return preset;
  };
  const create = (
    ownerId: string,
    data: Omit<PresetCreateRequest, 'ownerId'>,
  ) => {
    return repository.create({...data, ownerId});
  };

  const update = async (
    userId: string,
    id: string,
    data: PresetCreateRequest,
  ) => {
    await findById(userId, id);
    return repository.update(id, data);
  };

  const deletePreset = async (userId: string, id: string) => {
    const preset = await repository.findById(id);
    if (!preset) {
      throw httpErrors.notFound(`Preset with id ${id} not found`);
    }
    if (preset.ownerId !== userId) {
      throw httpErrors.forbidden('You are not allowed to delete this preset');
    }
    return repository.deletePreset(id);
  };

  return {
    findById,
    create,
    update,
    deletePreset,
  };
};
