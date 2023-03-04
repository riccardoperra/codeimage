import {PresetMapper} from '../mapper';
import {PresetRepository} from '../repository';

export type PresetHandlerDependencies = {
  repository: PresetRepository;
  mapper: PresetMapper;
};
