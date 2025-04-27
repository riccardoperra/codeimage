import {FastifyError} from 'fastify';
import {constants} from 'http2';

type HttpStatusCode = {
  readonly [K in keyof typeof constants as K extends `HTTP_STATUS_${string}`
    ? K
    : never]: (typeof constants)[K];
};

export abstract class HandlerError<
    Args extends Record<string, string | number> | void = void,
  >
  extends Error
  implements FastifyError
{
  code = this.constructor.name;

  static httpStatusCode = constants as HttpStatusCode;

  constructor(args?: Args) {
    super();
    this.message = this.createMessage(args as Args);
    Error.captureStackTrace(this, this.constructor);
  }

  abstract createMessage(args: Args): string;
}
