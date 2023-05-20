import {FastifyInstance} from 'fastify';
import {PresetMapper} from '../mapper/index.js';
import type {PresetRepository} from '../repository/index.js';

export type PresetHandlerDependencies = {
  repository: PresetRepository;
  mapper: PresetMapper;
  config: FastifyInstance['config'];
};
