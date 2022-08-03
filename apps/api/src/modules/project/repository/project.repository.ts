import {Project} from '@codeimage/prisma-models';
import type {
  ProjectCreateRequest,
  ProjectUpdateRequest,
  ProjectUpdateResponse,
} from '../domain';
import {ProjectCreateResponse} from '../domain';

export interface ProjectRepository {
  findById(id: string): Promise<Project | null>;

  updateProjectName(
    userId: string,
    projectId: string,
    newName: string,
  ): Promise<Project>;

  createNewProject(
    userId: string,
    data: ProjectCreateRequest,
  ): Promise<ProjectCreateResponse>;

  updateProject(
    userId: string,
    projectId: string,
    data: ProjectUpdateRequest,
  ): Promise<ProjectUpdateResponse>;

  deleteProject(id: string, userId: string): Promise<Project>;

  findAllByUserId(userId: string): Promise<Project[]>;
}
