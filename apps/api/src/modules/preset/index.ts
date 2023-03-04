import {ComposeHandlers} from '@api/domain';
import {FastifyPluginAsync} from 'fastify';
import {registerHandlers} from '../../common/domainFunctions/handlers';
import {create} from './handlers/create';
import {remove} from './handlers/delete';
import {findById} from './handlers/findById';
import {update} from './handlers/update';
import {makePrismaPresetRepository} from './infra/prisma/prisma-preset.repository';
import {PresetRepository} from './repository/preset.repository';

const handlers = [create, remove, findById, update] as const;

export const preset: FastifyPluginAsync = async fastify => {
  fastify.decorate(
    'presetRepository',
    makePrismaPresetRepository(fastify.prisma),
  );
  fastify.decorate(
    'presetService',
    registerHandlers(
      handlers,
      {repository: fastify.presetRepository},
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
