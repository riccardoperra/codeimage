import {FastifyPluginAsync} from 'fastify';
import {prepareHandlers} from './handler';
import findAllByUserId from './handlers/findByUserId';
import {ProjectRepository} from './repository';
import clone from './handlers/clone';
import createNewProject from './handlers/createNewProject';
import findById from './handlers/findById';
import update from './handlers/update';
import updateName from './handlers/updateName';
import {ResolvedHandlersMap} from '@api/domain';

const handlers = {
  clone,
  createNewProject,
  findById,
  update,
  updateName,
} as const;

export const project: FastifyPluginAsync = async fastify => {
  // TODO: to remove
  fastify.decorate('projectRepository', new ProjectRepository(fastify.prisma));

  fastify.decorate(
    'projectService',
    prepareHandlers(handlers)({
      repository: fastify.projectRepository,
      httpErrors: fastify.httpErrors,
    }),
  );

  fastify.register(findAllByUserId);
};

declare module 'fastify' {
  interface FastifyInstance {
    projectRepository: ProjectRepository;
    projectService: ResolvedHandlersMap<any, typeof handlers>;
  }
}

export default project;
