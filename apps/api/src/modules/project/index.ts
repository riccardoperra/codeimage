import {FastifyPluginAsync} from 'fastify';
import {makeProjectService, ProjectService} from './handlers/project.service';
import {makePrismaProjectRepository, ProjectRepository} from './repository';

export const project: FastifyPluginAsync = async fastify => {
  // TODO: to remove
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
