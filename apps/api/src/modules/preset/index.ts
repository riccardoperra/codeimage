import {ComposeHandlers} from '@api/domain';
import {FastifyPluginAsync} from 'fastify';
import {registerHandlers} from '../../common/domainFunctions/handlers.js';
import {create} from './handlers/create.js';
import {remove} from './handlers/delete.js';
import {findAll} from './handlers/findAll.js';
import {findById} from './handlers/findById.js';
import {update} from './handlers/update.js';
import {PresetMapper} from './mapper/index.js';
import {PresetRepository} from './repository/index.js';
import {PrismaPresetRepository} from './repository/prisma-preset.repository.js';

const handlers = [create, remove, findById, update, findAll] as const;

const preset: FastifyPluginAsync = async fastify => {
  const mapper = new PresetMapper();

  fastify.decorate(
    'presetRepository',
    new PrismaPresetRepository(fastify.prisma),
  );
  fastify.decorate(
    'presetService',
    registerHandlers(
      handlers,
      {
        repository: fastify.presetRepository,
        mapper,
        config: fastify.config,
      },
      fastify.handlerRegistry,
    ),
  );
};

declare module 'fastify' {
  interface FastifyInstance {
    presetRepository: PresetRepository;
    presetService: ComposeHandlers<typeof handlers>;
  }
}
export default preset;
