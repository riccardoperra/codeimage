import {createNamedHandler} from '../handler';
import {ProjectUpdateRequest, ProjectUpdateResponse} from '../schema';

const event = 'project:update';

export const update = createNamedHandler(event, ({repository}) => {
  return async function update(
    userId: string,
    projectId: string,
    data: ProjectUpdateRequest,
  ): Promise<ProjectUpdateResponse> {
    return repository.updateProject(userId, projectId, data);
  };
});

export default update;

declare module '@api/domain' {
  interface DomainHandler {
    [event]: ResolveHandler<typeof update>;
  }
}
