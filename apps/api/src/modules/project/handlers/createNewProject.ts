import {createHandler} from '../handler';
import {createProjectRequestMapper} from '../mapper/create-project-mapper';
import {ProjectCreateRequest, ProjectCreateResponse} from '../schema';

export default createHandler(({repository}) => {
  return async function createNewProject(
    userId: string,
    data: ProjectCreateRequest,
  ): Promise<ProjectCreateResponse> {
    return repository.createNewProject(
      userId,
      createProjectRequestMapper(data),
    );
  };
});
