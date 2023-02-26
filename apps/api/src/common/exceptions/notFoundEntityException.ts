import {HandlerError} from './handlerError';

export class NotFoundEntityException<
  Args extends Record<string, string | number> | void = void,
> extends HandlerError<Args> {
  createMessage(): string {
    return 'Resource not found';
  }
}
