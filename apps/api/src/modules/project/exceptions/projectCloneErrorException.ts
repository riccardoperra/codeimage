import {NotFoundEntityException} from '../../../common/exceptions/notFoundEntityException';

export class ProjectNotFoundOnCloneError extends NotFoundEntityException<{
  id: string;
}> {
  createMessage(args: {id: string}) {
    return `Cannot clone project with id ${args.id} since it does not exists`;
  }
}
