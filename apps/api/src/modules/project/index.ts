import {FastifyPluginAsync} from 'fastify';
import {
  makeProjectService,
  ProjectService,
} from './handlers/project.service.js';
import {makePrismaProjectRepository} from './infra/prisma/prisma-project.repository.js';
import {ProjectRepository} from './repository/index.js';

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
