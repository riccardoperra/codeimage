import {PresetCreateRequest} from './../domain/index';
import {PresetCreateResponse} from '../domain';

export interface PresetRepository {
  findById(id: string): Promise<PresetCreateResponse | null>;
  create(data: PresetCreateRequest): Promise<PresetCreateResponse>;
  update(id: string, data: PresetCreateRequest): Promise<PresetCreateResponse>;
  deletePreset(id: string): Promise<PresetCreateResponse>;
}
