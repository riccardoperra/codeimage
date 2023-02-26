import {HandlerError} from './handlerError';

export class EntityNotUpdatableException extends HandlerError<{code: string}> {
  createMessage(args: {code: string}): string {
    return `Entity with id ${args.code} not updatable`;
  }
}
