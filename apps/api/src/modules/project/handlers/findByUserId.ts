import {User} from '@codeimage/prisma-models';
import {NotFoundEntityException} from '../../../common/exceptions/notFoundEntityException';
import {createHandler} from '../handler';
import {createCompleteProjectGetByIdResponseMapper} from '../mapper/get-project-by-id-mapper';
import {ProjectCompleteResponse} from '../schema';

interface Params {
  id: string;
  user: User;
}

export default createHandler(({repository}) => {
  return async ({id, user}: Params): Promise<ProjectCompleteResponse> => {
    const project = await repository.findById(id);

    if (!project) {
      throw new NotFoundEntityException();
    }

    const isOwner = !!user && user.id === project.ownerId;

    const mappedProject = createCompleteProjectGetByIdResponseMapper(project);
    mappedProject.isOwner = isOwner;

    return mappedProject;
  };
});
