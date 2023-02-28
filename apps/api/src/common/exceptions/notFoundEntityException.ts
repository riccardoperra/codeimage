import {HandlerError} from './handlerError';

export class NotFoundEntityException<
  Args extends Record<string, string | number> | void = void,
> extends HandlerError<Args> {
  createMessage(_args: Args): string {
    return 'Resource not found';
  }
}
