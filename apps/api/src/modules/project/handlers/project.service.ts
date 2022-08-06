import {Project} from '@codeimage/prisma-models';
import {createProjectRequestMapper} from '../mapper/create-project-mapper';
import {ProjectRepository} from '../repository';
import {
  ProjectCreateRequest,
  ProjectCreateResponse,
  ProjectUpdateRequest,
  ProjectUpdateResponse,
} from '../schema';

export interface ProjectService {
  findById(id: string): Promise<Project>;

  findAllByUserId(userId: string): Promise<Project[]>;

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
}

export function makeProjectService(
  repository: ProjectRepository,
): ProjectService {
  return {
    async findById(id: string): Promise<Project> {
      return repository.findById(id);
    },
    async findAllByUserId(userId: string): Promise<Project[]> {
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
  };
}
