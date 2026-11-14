import type {Project, User} from '@codeimage/prisma-models';
import {ProjectErrors} from '../project.model.js';
import {createProjectRequestMapper} from '../mapper/create-project-mapper.js';
import {createCompleteProjectGetByIdResponseMapper} from '../mapper/get-project-by-id-mapper.js';
import type {ProjectRepository} from '../repository/index.js';
import {
  type ProjectCreateRequest,
  type ProjectCreateResponse,
  type ProjectGetByIdResponse,
  type ProjectUpdateRequest,
  type ProjectUpdateResponse,
} from '../schema/index.js';
import type {ProjectCompleteResponse} from '../schema/project-get-by-id.schema.js';

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
): ProjectService {
  return {
    async findById(
      user: User | null,
      id: string,
    ): Promise<ProjectCompleteResponse> {
      const project = await repository.findById(id);

      if (!project) {
        throw ProjectErrors.notFound({id: id});
      }

      const isOwner = !!user && user.id === project.ownerId;

      const mappedProject = createCompleteProjectGetByIdResponseMapper(project);
      mappedProject.isOwner = isOwner;

      return mappedProject;
    },
    findAllByUserId(userId: string): Promise<ProjectGetByIdResponse[]> {
      return repository.findAllByUserId(userId);
    },
    createNewProject(
      userId: string,
      data: ProjectCreateRequest,
    ): Promise<ProjectCreateResponse> {
      return repository.createNewProject(
        userId,
        createProjectRequestMapper(data),
      );
    },
    async updateName(userId: string, projectId: string, newName: string) {
      const project = await repository.updateProjectName(
        userId,
        projectId,
        newName,
      );
      if (!project) {
        throw ProjectErrors.notFound({id: projectId});
      }
      return project;
    },
    async update(userId, projectId, data) {
      const project = await repository.updateProject(userId, projectId, data);
      if (!project) {
        throw ProjectErrors.notFound({id: projectId});
      }
      return project;
    },
    async clone(
      user: User,
      projectId: string,
      newName: string | null,
    ): Promise<ProjectCreateResponse> {
      const project = await repository.findById(projectId);
      if (!project) throw ProjectErrors.cloneSourceNotFound({id: projectId});
      return this.createNewProject(user.id, {
        name: newName ?? project.name,
        frame: project.frame,
        editors: project.editorTabs,
        editorOptions: project.editorOptions,
        terminal: project.terminal,
      });
    },
  };
}
