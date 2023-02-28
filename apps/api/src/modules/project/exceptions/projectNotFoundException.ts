import {NotFoundEntityException} from '../../../common/exceptions/notFoundEntityException';

export class ProjectNotFoundException extends NotFoundEntityException<{
  id: string;
}> {
  createMessage(args: {id: string}): string {
    return `Project with id ${args.id} not found`;
  }
}
