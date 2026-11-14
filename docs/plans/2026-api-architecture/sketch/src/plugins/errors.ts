/**
 * The only place an error becomes an HTTP response. Root-level, so every route shares it.
 *
 * Replaces plugins/errorHandler.ts (three error styles in, one envelope out) and @fastify/sensible.
 * The envelope is a superset of today's: `{statusCode, error, message, code, requestId, details?}`.
 * Today's tests that assert `code: 'NotFoundPresetException'` and the exact messages keep passing,
 * because those codes and messages are preserved in the preset error catalog.
 */
import {STATUS_CODES} from 'node:http';
import type {FastifyError} from 'fastify';
import fp from 'fastify-plugin';
import type {ErrorEnvelope} from '../shared/contract.js';
import {ErrorEnvelopeSchema} from '../shared/contract.js';
import {isRecordNotFound, isUniqueViolation} from '../shared/db.js';
import {AppError, CommonErrors, type ErrorKind} from '../shared/errors.js';

/** The one kind → status table. */
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

/** A thrown value, classified. Pure, so the whole table is unit-tested without Fastify. */
export interface Failure {
  readonly statusCode: number;
  readonly code: string;
  /** Already masked for 5xx. */
  readonly message: string;
  readonly details?: ErrorEnvelope['details'];
  /** 4xx are expected outcomes (warn); 5xx are bugs (error, with stack and cause). */
  readonly logLevel: 'warn' | 'error';
}

/**
 * Order matters:
 * 1. AppError → its kind's status, its code, its message (5xx masked).
 * 2. Fastify schema validation (`error.validation`) → 400 INVALID_REQUEST with details.
 * 3. Prisma P2025 / P2002 that escaped a repository → CommonErrors.recordNotFound / conflict.
 *    (Today a P2025 on DELETE of a missing or foreign project is a 500.)
 * 4. Other errors that carry a 4xx statusCode (bad JSON 400, 413, 415) → keep status and message.
 * 5. Anything else → 500 INTERNAL, message replaced by the reason phrase.
 */
export function classify(thrown: unknown): Failure {
  // TODO
  // const error = thrown instanceof Error ? thrown : new Error(String(thrown));
  // if (error instanceof AppError) return fromAppError(error);
  // if ('validation' in error && Array.isArray(error.validation))
  //   return {statusCode: 400, code: 'INVALID_REQUEST', message: error.message, logLevel: 'warn',
  //           details: error.validation.map(v => ({path: v.instancePath, message: v.message ?? 'invalid'}))};
  // if (isRecordNotFound(error)) return fromAppError(CommonErrors.recordNotFound());
  // if (isUniqueViolation(error)) return fromAppError(CommonErrors.conflict());
  // const status = (error as FastifyError).statusCode;
  // if (typeof status === 'number' && status >= 400 && status < 500)
  //   return {statusCode: status, code: (error as FastifyError).code ?? 'BAD_REQUEST', message: error.message, logLevel: 'warn'};
  // return {statusCode: 500, code: 'INTERNAL', message: STATUS_CODES[500]!, logLevel: 'error'};
  void [thrown, AppError, CommonErrors, isRecordNotFound, isUniqueViolation];
  throw new Error('not implemented');
}

function fromAppError(error: AppError): Failure {
  const statusCode = statusByKind[error.kind];
  return {
    statusCode,
    code: error.code,
    message: statusCode >= 500 ? (STATUS_CODES[statusCode] ?? 'Error') : error.message,
    logLevel: statusCode >= 500 ? 'error' : 'warn',
  };
}

export default fp(
  async fastify => {
    fastify.addSchema(ErrorEnvelopeSchema);

    fastify.setErrorHandler((thrown: FastifyError | Error, request, reply) => {
      const failure = classify(thrown);
      request.log[failure.logLevel]({err: thrown, code: failure.code}, failure.message);
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

    // Unknown routes never reach the error handler: answer with the same envelope.
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
