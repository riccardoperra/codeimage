import {User} from '@codeimage/prisma-models';
import {ProjectNotFoundException} from '../exceptions/projectNotFoundException';
import {createHandler} from '../handler';
import {ProjectCompleteResponse} from '../schema';

export default createHandler(({repository, mapper}) => {
  return async function findByUserId(
    user: User | null,
    id: string,
  ): Promise<ProjectCompleteResponse> {
    const project = await repository.findById(id);

    if (!project) {
      throw new ProjectNotFoundException({id});
    }

    return mapper.fromDomainToCompleteProjectResponse(project, user?.id);
  };
});
