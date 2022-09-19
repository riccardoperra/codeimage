import {Project, User} from '@codeimage/prisma-models';
import {HttpError, HttpErrors} from '@fastify/sensible/lib/httpError';
import {createProjectRequestMapper} from '../mapper/create-project-mapper';
import {createCompleteProjectGetByIdResponseMapper} from '../mapper/get-project-by-id-mapper';
import {ProjectRepository} from '../repository';
import {
  ProjectCreateRequest,
  ProjectCreateResponse,
  ProjectGetByIdResponse,
  ProjectUpdateRequest,
  ProjectUpdateResponse,
} from '../schema';
import {ProjectCompleteResponse} from '../schema/project-get-by-id.schema';

export interface ProjectService {
  findById(user: User | null, id: string): Promise<ProjectCompleteResponse>;

  findAllByUserId(userId: string): Promise<ProjectGetByIdResponse[]>;

  createNewProject(
    userId: string,
    data: ProjectCreateRequest,
  ): Promise<ProjectCreateResponse>;

  updateName(
    userId: string,
    projectId: string,
    newName: string,
  ): Promise<Project>;

  update(
    userId: string,
    projectId: string,
    data: ProjectUpdateRequest,
  ): Promise<ProjectUpdateResponse>;

  clone(
    user: User,
    projectId: string,
    newName: string | null,
  ): Promise<ProjectCreateResponse>;
}

export function makeProjectService(
  repository: ProjectRepository,
  httpErrors: HttpErrors,
): ProjectService {
  return {
    async findById(
      user: User | null,
      id: string,
    ): Promise<ProjectCompleteResponse> {
      const project = await repository.findById(id);

      if (!project) {
        throw httpErrors.notFound(`Project with id ${id} not found`);
      }

      const isOwner = !!user && user.id === project.ownerId;

      const mappedProject = createCompleteProjectGetByIdResponseMapper(project);
      mappedProject.isOwner = isOwner;

      return mappedProject;
    },
    async findAllByUserId(userId: string): Promise<ProjectGetByIdResponse[]> {
      return repository.findAllByUserId(userId);
    },
    async createNewProject(
      userId: string,
      data: ProjectCreateRequest,
    ): Promise<ProjectCreateResponse> {
      return repository.createNewProject(
        userId,
        createProjectRequestMapper(data),
      );
    },
    async updateName(userId: string, projectId: string, newName: string) {
      return repository.updateProjectName(projectId, newName);
    },
    async update(userId, projectId, data) {
      return repository.updateProject(userId, projectId, data);
    },
    async clone(
      user: User,
      projectId: string,
      newName: string | null,
    ): Promise<ProjectCreateResponse> {
      try {
        const project = await repository.findById(projectId);
        if (!project) {
          throw {name: 'NotFoundError'} as HttpError;
        }
        return this.createNewProject(user.id, {
          name: newName ?? project.name,
          frame: project.frame,
          editors: project.editorTabs,
          editorOptions: project.editorOptions,
          terminal: project.terminal,
        });
      } catch (e) {
        const error = e as HttpError;
        if (error && error.name === 'NotFoundError') {
          throw httpErrors.notFound(
            `Cannot clone project with id ${projectId} since it does not exists`,
          );
        }
        throw e;
      }
    },
  };
}
