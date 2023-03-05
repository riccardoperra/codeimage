import {HttpError} from '@fastify/sensible/lib/httpError';
import fp from 'fastify-plugin';
import {NotFoundEntityException} from '../common/exceptions/NotFoundEntityException';

export default fp(
  async fastify => {
    fastify.setErrorHandler(error => {
      let httpError: HttpError | null = null;

      if (error.statusCode) {
        httpError = fastify.httpErrors.createError(
          error.statusCode,
          error.message,
        );
      } else {
        if (error instanceof NotFoundEntityException) {
          httpError = fastify.httpErrors.notFound(error.message);
        }
      }

      if (httpError) {
        httpError.stack = error.stack;
        httpError.code = error.code;

        return httpError;
      }

      return error;
    });

    return;
  },
  {name: 'appErrorsHandler'},
);
