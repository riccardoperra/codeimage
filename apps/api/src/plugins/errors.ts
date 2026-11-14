import {STATUS_CODES} from 'node:http';
import type {FastifyError} from 'fastify';
import fp from 'fastify-plugin';
import type {ErrorEnvelope} from '../shared/contract.js';
import {ErrorEnvelopeSchema} from '../shared/contract.js';
import {isRecordNotFound, isUniqueViolation} from '../shared/db.js';
import {AppError, CommonErrors, type ErrorKind} from '../shared/errors.js';

export const statusByKind = {
  invalid: 400,
  unauthenticated: 401,
  forbidden: 403,
  not_found: 404,
  conflict: 409,
  unprocessable: 422,
  rate_limited: 429,
  internal: 500,
} as const satisfies Record<ErrorKind, number>;

export interface Failure {
  readonly statusCode: number;
  readonly code: string;
  readonly message: string;
  readonly details?: ErrorEnvelope['details'];
  readonly logLevel: 'warn' | 'error';
}

export function classify(thrown: unknown): Failure {
  if (thrown instanceof AppError) return fromAppError(thrown);
  const error = thrown instanceof Error ? thrown : new Error(String(thrown));
  if ('validation' in error && Array.isArray(error.validation)) {
    return {
      statusCode: 400,
      code: 'INVALID_REQUEST',
      message: error.message,
      logLevel: 'warn',
      details: error.validation.map(v => ({
        path: v.instancePath,
        message: v.message ?? 'invalid',
      })),
    };
  }
  if (isRecordNotFound(thrown))
    return fromAppError(CommonErrors.recordNotFound());
  if (isUniqueViolation(thrown)) return fromAppError(CommonErrors.conflict());
  if (
    'statusCode' in error &&
    typeof error.statusCode === 'number' &&
    error.statusCode >= 400 &&
    error.statusCode < 500
  ) {
    return {
      statusCode: error.statusCode,
      code:
        'code' in error && typeof error.code === 'string'
          ? error.code
          : 'BAD_REQUEST',
      message: error.message,
      logLevel: 'warn',
    };
  }
  return {
    statusCode: 500,
    code: 'INTERNAL',
    message: 'Internal Server Error',
    logLevel: 'error',
  };
}

function fromAppError(error: AppError): Failure {
  const statusCode = statusByKind[error.kind];
  return {
    statusCode,
    code: error.code,
    message:
      statusCode >= 500 ? (STATUS_CODES[statusCode] ?? 'Error') : error.message,
    logLevel: statusCode >= 500 ? 'error' : 'warn',
  };
}

export default fp(
  async fastify => {
    fastify.addSchema(ErrorEnvelopeSchema);

    fastify.setErrorHandler((thrown: FastifyError | Error, request, reply) => {
      const failure = classify(thrown);
      request.log[failure.logLevel](
        {err: thrown, code: failure.code},
        failure.message,
      );
      const body: ErrorEnvelope = {
        statusCode: failure.statusCode,
        error: STATUS_CODES[failure.statusCode] ?? 'Error',
        message: failure.message,
        code: failure.code,
        requestId: request.id,
        ...(failure.details ? {details: failure.details} : {}),
      };
      return reply.status(failure.statusCode).send(body);
    });
    fastify.setNotFoundHandler((request, reply) => {
      const failure = fromAppError(
        CommonErrors.routeNotFound({method: request.method, url: request.url}),
      );
      return reply.status(404).send({
        statusCode: 404,
        error: 'Not Found',
        message: failure.message,
        code: failure.code,
        requestId: request.id,
      } satisfies ErrorEnvelope);
    });
  },
  {name: 'errors'},
);
