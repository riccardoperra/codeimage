import {FastifyPluginAsync} from 'fastify';
import {makeProjectService, ProjectService} from './handlers/project.service';
import {makePrismaProjectRepository} from './infra/prisma/prisma-project.repository';
import {ProjectRepository} from './repository';

export const project: FastifyPluginAsync = async fastify => {
  fastify.decorate(
    'projectRepository',
    makePrismaProjectRepository(fastify.prisma),
  );

  fastify.decorate(
    'projectService',
    makeProjectService(fastify.projectRepository, fastify.httpErrors),
  );
};

declare module 'fastify' {
  interface FastifyInstance {
    projectRepository: ProjectRepository;
    projectService: ProjectService;
  }
}

export default project;
