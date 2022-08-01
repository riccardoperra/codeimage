import {Project} from '@codeimage/prisma-models';
import type {ProjectCreateRequest} from '../domain';
import {ProjectCreateResponse} from '../domain';

export interface ProjectRepository {
  findById(id: string): Promise<Project | null>;

  createNewProject(
    userId: string,
    data: ProjectCreateRequest,
  ): Promise<ProjectCreateResponse>;

  deleteProject(id: string, userId: string): Promise<Project>;

  findAllByUserId(userId: string): Promise<Project[]>;
}
