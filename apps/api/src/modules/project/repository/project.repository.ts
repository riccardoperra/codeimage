import {Project} from '@codeimage/prisma-models';
import type * as DomainModel from '../domain';
import {PartialProjectGetByIdResponse, ProjectGetByIdResponse} from '../domain';

export interface ProjectRepository {
  findById(id: string): Promise<ProjectGetByIdResponse | null>;

  updateProjectName(projectId: string, newName: string): Promise<Project>;

  createNewProject(
    userId: string,
    data: DomainModel.ProjectCreateRequest,
  ): Promise<DomainModel.ProjectCreateResponse>;

  updateProject(
    userId: string,
    projectId: string,
    data: DomainModel.ProjectUpdateRequest,
  ): Promise<DomainModel.ProjectUpdateResponse>;

  deleteProject(id: string, userId: string): Promise<Project>;

  findAllByUserId(userId: string): Promise<PartialProjectGetByIdResponse[]>;
}
