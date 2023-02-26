import {HandlerError} from './handlerError';

export class NotFoundEntityException extends HandlerError {
  createMessage(): string {
    return 'Resource not found';
  }
}
