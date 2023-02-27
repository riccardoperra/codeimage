import {FastifyPluginAsync} from 'fastify';
import {prepareHandlers} from './handler';
import * as handlers from './handlers';
import {makePrismaProjectRepository, ProjectRepository} from './repository';

const resolveHandlers = prepareHandlers(handlers);

export const project: FastifyPluginAsync = async fastify => {
  // TODO: to remove
  fastify.decorate(
    'projectRepository',
    makePrismaProjectRepository(fastify.prisma),
  );

  fastify.decorate(
    'projectService',
    resolveHandlers({
      repository: fastify.prisma,
      httpErrors: fastify.httpErrors,
    }),
  );
};

declare module 'fastify' {
  interface FastifyInstance {
    projectRepository: ProjectRepository;
    projectService: ReturnType<typeof resolveHandlers>;
  }
}

export default project;
