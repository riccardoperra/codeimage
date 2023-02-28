import {createHandler} from '../handler';
import {ProjectCreateRequest, ProjectCreateResponse} from '../schema';

export default createHandler(({repository, mapper}) => {
  return async function createNewProject(
    userId: string,
    data: ProjectCreateRequest,
  ): Promise<ProjectCreateResponse> {
    return repository.createNewProject(
      userId,
      mapper.fromCreateRequestToDomainModel(data),
    );
  };
});
