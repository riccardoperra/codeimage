import {HttpError} from '@fastify/sensible/lib/httpError.js';
import fp from 'fastify-plugin';
import {NotFoundEntityException} from '../common/exceptions/NotFoundEntityException.js';

export default fp(
  async fastify => {
    fastify.setErrorHandler((error, request, reply) => {
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

        return reply.send(httpError);
      }

      reply.send(error);
    });
  },
  {name: 'appErrorsHandler'},
);
