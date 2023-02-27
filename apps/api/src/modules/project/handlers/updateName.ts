import {createHandler} from '../handler';
import {ProjectUpdateRequest, ProjectUpdateResponse} from '../schema';

export default createHandler(({repository}) => {
  return async function update(
    userId: string,
    projectId: string,
    data: ProjectUpdateRequest,
  ): Promise<ProjectUpdateResponse> {
    return repository.updateProject(userId, projectId, data);
  };
});
