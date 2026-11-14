import type {Project} from '@codeimage/prisma-models';
import type * as DomainModel from '../domain/index.js';
import type {
  PartialProjectGetByIdResponse,
  ProjectGetByIdResponse,
} from '../domain/index.js';

export interface ProjectRepository {
  findById(id: string): Promise<ProjectGetByIdResponse | null>;

  updateProjectName(
    userId: string,
    projectId: string,
    newName: string,
  ): Promise<Project | null>;

  createNewProject(
    userId: string,
    data: DomainModel.ProjectCreateRequest,
  ): Promise<DomainModel.ProjectCreateResponse>;

  updateProject(
    userId: string,
    projectId: string,
    data: DomainModel.ProjectUpdateRequest,
  ): Promise<DomainModel.ProjectUpdateResponse | null>;

  deleteProject(id: string, userId: string): Promise<Project>;

  findAllByUserId(userId: string): Promise<PartialProjectGetByIdResponse[]>;
}
