import {HandlerError} from './HandlerError';

export abstract class NotFoundEntityException<
  Args extends Record<string, string | number> | void = void,
> extends HandlerError<Args> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  abstract createMessage(args: Args): string;
}
