import {HandlerError} from './handlerError';

export class EntityNotUpdatableException<
  Args extends Record<string, string | number> | void = void,
> extends HandlerError<Args> {
  createMessage(): string {
    return `Cannot update given entity`;
  }
}
