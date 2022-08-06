import {FastifyPluginAsync} from 'fastify';
import {makePrismaProjectRepository} from './infra/prisma/prisma-project.repository';
import {ProjectRepository} from './repository';
import {makeProjectService, ProjectService} from './handlers/project.service';

export const project: FastifyPluginAsync = async fastify => {
  fastify.decorate(
    'projectRepository',
    makePrismaProjectRepository(fastify.prisma),
  );

  fastify.decorate(
    'projectService',
    makeProjectService(fastify.projectRepository),
  );
};

declare module 'fastify' {
  interface FastifyInstance {
    projectRepository: ProjectRepository;
    projectService: ProjectService;
  }
}

export default project;
