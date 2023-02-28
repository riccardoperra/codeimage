import * as DomainModel from '../domain';
import {ProjectCompleteResponse, ProjectCreateRequest} from '../schema';

export interface ProjectMapper {
  fromCreateRequestToDomainModel(
    dto: ProjectCreateRequest,
  ): DomainModel.ProjectCreateRequest;

  fromDomainToCompleteProjectResponse(
    domain: DomainModel.ProjectGetByIdResponse,
    userId?: string,
  ): ProjectCompleteResponse;
}
