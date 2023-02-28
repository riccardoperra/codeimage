import {User} from '@codeimage/prisma-models';
import {ProjectNotFoundException} from '../exceptions/projectNotFoundException';
import {createHandler} from '../handler';
import {createCompleteProjectGetByIdResponseMapper} from '../mapper/get-project-by-id-mapper';
import {ProjectCompleteResponse} from '../schema';

export default createHandler(({repository}) => {
  return async function findByUserId(
    user: User | null,
    id: string,
  ): Promise<ProjectCompleteResponse> {
    const project = await repository.findById(id);

    if (!project) {
      throw new ProjectNotFoundException({id});
    }

    const isOwner = !!user && user.id === project.ownerId;

    const mappedProject = createCompleteProjectGetByIdResponseMapper(project);
    mappedProject.isOwner = isOwner;

    return mappedProject;
  };
});
