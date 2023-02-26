import {PresetCreateResponse} from '../domain';

export interface PresetRepository {
  findById(id: string): Promise<PresetCreateResponse | null>;
  create(
    ownerId: string,
    data: PresetCreateResponse,
  ): Promise<PresetCreateResponse>;
}
