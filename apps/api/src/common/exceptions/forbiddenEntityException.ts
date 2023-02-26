import {HandlerError} from './handlerError';

export class ForbiddenEntityException<
  Args extends Record<string, string | number> | void = void,
> extends HandlerError<Args> {
  createMessage(): string {
    return 'Entity not accessible';
  }
}
