import {Project} from '@codeimage/prisma-models';
import {ProjectRepository} from '../repository';
import {ProjectCreateRequest, ProjectCreateResponse} from '../schema';

export interface ProjectService {
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
}

export function makeProjectService(
  repository: ProjectRepository,
): ProjectService {
  return {
    findAllByUserId(userId: string): Promise<Project[]> {
      return repository.findAllByUserId(userId);
    },
    async createNewProject(
      userId: string,
      data: ProjectCreateRequest,
    ): Promise<ProjectCreateResponse> {
      // @ts-ignore
      return repository.createNewProject(userId, data);
    },
    async updateName(userId: string, projectId: string, newName: string) {
      return repository.updateProjectName(projectId, newName);
    },
  };
}
