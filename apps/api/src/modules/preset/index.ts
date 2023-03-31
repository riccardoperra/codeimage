import {ComposeHandlers} from '@api/domain';
import {FastifyPluginAsync} from 'fastify';
import {registerHandlers} from '../../common/domainFunctions/handlers';
import {create} from './handlers/create';
import {remove} from './handlers/delete';
import {findAll} from './handlers/findAll';
import {findById} from './handlers/findById';
import {update} from './handlers/update';
import {PresetMapper} from './mapper';
import {PresetRepository} from './repository';
import {PrismaPresetRepository} from './repository/prisma-preset.repository';

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
        logger: fastify.log,
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
