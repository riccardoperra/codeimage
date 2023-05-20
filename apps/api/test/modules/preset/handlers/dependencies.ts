import {FastifyInstance} from 'fastify';
import {PresetHandlerDependencies} from '../../../../src/modules/preset/handlers/index.js';
import {PresetMapper} from '../../../../src/modules/preset/mapper/index.js';
import {PresetRepository} from '../../../../src/modules/preset/repository/index.js';

export const dependencies: PresetHandlerDependencies = {
  mapper: {
    fromEntityToDto: () => void 0,
  } as unknown as PresetMapper,
  repository: {
    create: () => void 0,
    deletePreset: () => void 0,
    findByIdAndOwnerId: () => void 0,
    update: () => void 0,
    findAllByOwnerId: () => void 0,
    countByOwnerId: () => void 0,
  } as unknown as PresetRepository,
  config: {
    PRESETS_LIMIT: 20,
  } as FastifyInstance['config'],
} as const;
