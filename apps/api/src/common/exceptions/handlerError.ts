import {FastifyError} from 'fastify';

export abstract class HandlerError<
    Args extends Record<string, string | number> | void = void,
  >
  extends Error
  implements FastifyError
{
  code = this.constructor.name;

  constructor(args: Args) {
    super();
    this.message = this.createMessage(args);
    Error.captureStackTrace(this, this.constructor);
  }

  abstract createMessage(args: Args): string;
}
