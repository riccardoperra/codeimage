import {createNamedHandler} from '../handler';
import {ProjectCreateRequest, ProjectCreateResponse} from '../schema';

const event = 'createNewProject';

const createNewProject = createNamedHandler(event, ({repository, mapper}) => {
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

export default createNewProject;

declare module '@api/domain' {
  interface DomainHandler {
    createNewProject: ResolveHandler<typeof createNewProject>;
  }
}
