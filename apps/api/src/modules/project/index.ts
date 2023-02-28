import {FastifyPluginAsync} from 'fastify';
import {prepareHandlers} from './handler';
import * as handlers from './handlers';
import findAllByUserId from './handlers/findByUserId';
import {ProjectRepository} from './repository';

const resolveHandlers = prepareHandlers(handlers);

export const project: FastifyPluginAsync = async fastify => {
  // TODO: to remove
  fastify.decorate('projectRepository', new ProjectRepository(fastify.prisma));

  fastify.decorate(
    'projectService',
    resolveHandlers({
      repository: fastify.projectRepository,
      httpErrors: fastify.httpErrors,
    }),
  );

  fastify.register(findAllByUserId);
};

declare module 'fastify' {
  interface FastifyInstance {
    projectRepository: ProjectRepository;
    projectService: ReturnType<typeof resolveHandlers>;
  }
}

export default project;
