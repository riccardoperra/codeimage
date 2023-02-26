import {HttpErrors} from '@fastify/sensible/lib/httpError';
import {PresetCreateResponse} from '../domain';
import {PresetRepository} from '../repository';
export interface PresetService {
  findById(id: string): Promise<PresetCreateResponse | null>;
}
export const makePresetService = (
  presetRepository: PresetRepository,
  httpErrors: HttpErrors,
): PresetService => {
  return {
    async findById(id: string): Promise<PresetCreateResponse | null> {
      const preset = await presetRepository.findById(id);
      if (!preset) {
        throw httpErrors.notFound(`Preset with id ${id} not found`);
      }
      return preset;
    },
  };
};
