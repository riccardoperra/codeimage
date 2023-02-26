import {HttpErrors} from '@fastify/sensible/lib/httpError';
import {PresetCreateRequest, PresetCreateResponse} from '../domain';
import {PresetRepository} from '../repository';
type PresetCompleteResponse = PresetCreateResponse & {isOwner: boolean};
export interface PresetService {
  findById(ownerId: string | null, id: string): Promise<PresetCompleteResponse>;
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
  ): Promise<PresetCompleteResponse> => {
    const preset = await repository.findById(id);
    if (!preset) {
      throw httpErrors.notFound(`Preset with id ${id} not found`);
    }
    const isOwner = !!ownerId && ownerId === preset.ownerId;

    return {...preset, isOwner};
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
    const preset = await repository.findById(id);
    if (!preset) {
      throw httpErrors.notFound(`Preset with id ${id} not found`);
    }
    if (preset.ownerId !== userId) {
      throw httpErrors.forbidden('You are not allowed to update this preset');
    }
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
