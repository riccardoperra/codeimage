import {HandlerError} from './handlerError';

export class ForbiddenEntityException extends HandlerError {
  createMessage(): string {
    return 'Entity not accessible';
  }
}
