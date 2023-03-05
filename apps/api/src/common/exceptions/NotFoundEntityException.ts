import {HandlerError} from './HandlerError';

export class NotFoundEntityException<
  Args extends Record<string, string | number> | void = void,
> extends HandlerError<Args> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  createMessage(args: Args): string {
    return 'Resource not found';
  }
}
