import {PresetRepository} from './repository/preset.repository';
import {FastifyPluginAsync} from 'fastify';
import {makePresetService, PresetService} from './handlers/preset.service';
import {makePrismaPresetRepository} from './infra/prisma/prisma-preset.repository';

export const preset: FastifyPluginAsync = async fastify => {
  fastify.decorate(
    'presetRepository',
    makePrismaPresetRepository(fastify.prisma),
  );
  fastify.decorate(
    'presetService',
    makePresetService(fastify.presetRepository, fastify.httpErrors),
  );
};

declare module 'fastify' {
  interface FastifyInstance {
    presetRepository: PresetRepository;
    presetService: PresetService;
  }
}
export default preset;
