import {ResolveHandlerMap} from '@api/domain';
import {FastifyPluginAsync} from 'fastify';
import {resolveHandlers} from './handler';
import clone from './handlers/clone';
import createNewProject from './handlers/createNewProject';
import findById from './handlers/findById';
import {findAllByUserId} from './handlers/findByUserId';
import update from './handlers/update';
import updateName from './handlers/updateName';
import {ProjectMapper} from './mapper';
import {createProjectRequestMapper} from './mapper/create-project-mapper';
import {createCompleteProjectGetByIdResponseMapper} from './mapper/get-project-by-id-mapper';
import {ProjectRepository} from './repository';

const handlers = {
  clone,
  createNewProject,
  findById,
  update,
  updateName,
} as const;

const mapper: ProjectMapper = {
  fromCreateRequestToDomainModel: createProjectRequestMapper,
  fromDomainToCompleteProjectResponse:
    createCompleteProjectGetByIdResponseMapper,
};

export const project: FastifyPluginAsync = async fastify => {
  fastify.decorate('projectRepository', new ProjectRepository(fastify.prisma));
  fastify.decorate('projectMapper', mapper);

  const dependencies = {
    repository: fastify.projectRepository,
    httpErrors: fastify.httpErrors,
    mapper: fastify.projectMapper,
  } as const;

  fastify.decorate('projectService', resolveHandlers(handlers, dependencies));

  fastify.eventRegistry.add(findAllByUserId, dependencies);
};

declare module 'fastify' {
  interface FastifyInstance {
    projectMapper: ProjectMapper;
    projectRepository: ProjectRepository;
    projectService: ResolveHandlerMap<typeof handlers>;
  }
}

export default project;
