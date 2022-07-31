import {FastifyPluginAsync} from 'fastify';
import {makePrismaProjectRepository} from './infra/prisma/prisma-project.repository';
import {ProjectRepository} from './repository';

export const project: FastifyPluginAsync = async fastify => {
  await fastify.decorate(
    'projectRepository',
    makePrismaProjectRepository(fastify.prisma),
  );
};

declare module 'fastify' {
  interface FastifyInstance {
    projectRepository: ProjectRepository;
  }
}

export default project;
