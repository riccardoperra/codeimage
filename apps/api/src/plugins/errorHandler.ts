import type {HttpError} from '@fastify/sensible/lib/httpError.js';
import fp from 'fastify-plugin';
import type {HandlerError} from '../common/exceptions/HandlerError.js';
import {NotFoundEntityException} from '../common/exceptions/NotFoundEntityException.js';

export default fp(
  async fastify => {
    fastify.setErrorHandler((error, request, reply) => {
      let httpError: HttpError | null = null;

      if (
        !!error &&
        typeof error === 'object' &&
        'statusCode' in error &&
        'message' in error
      ) {
        httpError = fastify.httpErrors.createError(
          error.statusCode as number,
          error.message as string,
        );
      } else {
        if (error instanceof NotFoundEntityException) {
          httpError = fastify.httpErrors.notFound(error.message);
        }
      }

      if (httpError) {
        httpError.stack = (error as HandlerError).stack;
        httpError.code = (error as HandlerError).code;

        return reply.send(httpError);
      }

      reply.send(error);
    });
  },
  {name: 'appErrorsHandler'},
);
