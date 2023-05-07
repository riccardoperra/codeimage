import {HandlerError} from './HandlerError.js';

export abstract class UnprocessableEntityException<
  Args extends Record<string, string | number> | void = void,
> extends HandlerError<Args> {
  statusCode = HandlerError.httpStatusCode.HTTP_STATUS_UNPROCESSABLE_ENTITY;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  abstract createMessage(args: Args): string;
}
