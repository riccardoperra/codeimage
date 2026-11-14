/**
 * The one error model.
 *
 * Business code throws AppError values built from a per-module catalog (`defineErrors`).
 * `plugins/errors.ts` is the only place that turns an error into an HTTP response.
 *
 * Invariants:
 * - Every code is defined exactly once. Codes are part of the public contract: never rename one.
 *   `defineErrors` throws at import time (so at boot, and in every test run) on a duplicate.
 * - Business code never picks an HTTP status. It picks a kind; one table maps kind to status.
 * - `new AppError(` appears only in this file (architecture test). There is no subclass tree.
 *
 * Framework-free: models, services, plugins and http/ all import it.
 */

export type ErrorKind =
  | 'invalid' // 400
  | 'unauthenticated' // 401
  | 'forbidden' // 403
  | 'not_found' // 404
  | 'conflict' // 409
  | 'unprocessable' // 422
  | 'rate_limited' // 429
  | 'internal'; // 500, message masked in the response

export class AppError extends Error {
  override readonly name = 'AppError';
  /** Stable, machine-readable. Sent to clients as `code`. */
  readonly code: string;
  readonly kind: ErrorKind;

  /** Construct through a `defineErrors` factory only. */
  constructor(init: {
    code: string;
    kind: ErrorKind;
    message: string;
    cause?: unknown;
  }) {
    super(init.message, {cause: init.cause});
    this.code = init.code;
    this.kind = init.kind;
  }
}

export interface ErrorSpec<P> {
  /** Stable code. New codes use UPPER_SNAKE. Codes already on the wire keep their spelling. */
  readonly code: string;
  readonly kind: ErrorKind;
  /** Human-readable message. Clients must branch on `code`, never on this. */
  readonly message: (params: P) => string;
}

/** `PresetErrors.notFound({id, ownerId})` builds the error; `.code` and `.is` serve tests and recovery. */
export type ErrorFactory<P> = ((
  ...args: [P] extends [void] ? [] : [params: P]
) => AppError) & {
  readonly code: string;
  is(error: unknown): error is AppError;
};

/** `() => string` infers `unknown`, which means "no params". */
type ParamsOf<S> = S extends {message: (params: infer P) => string}
  ? unknown extends P
    ? void
    : P
  : never;

const catalog = new Map<string, ErrorKind>();

export function defineErrors<
  const D extends Readonly<Record<string, ErrorSpec<never>>>,
>(specs: D): {readonly [K in keyof D]: ErrorFactory<ParamsOf<D[K]>>} {
  // TODO
  // for (const [key, spec] of Object.entries(specs)):
  //   if (catalog.has(spec.code)) throw new Error(`Error code ${spec.code} is defined twice (${key}).`)
  //   catalog.set(spec.code, spec.kind)
  //   const factory = (params) => new AppError({code: spec.code, kind: spec.kind, message: spec.message(params)})
  //   attach factory.code = spec.code and factory.is = e => e instanceof AppError && e.code === spec.code
  // return the object of factories, keyed like `specs`
  void specs;
  void catalog;
  throw new Error('not implemented');
}

/** Every code with its kind. Derived from the catalogs; feeds the OpenAPI error docs. */
export function errorCatalog(): ReadonlyMap<string, ErrorKind> {
  return catalog;
}

/** Errors that belong to no module: auth, rate limiting, generic persistence outcomes. */
export const CommonErrors = defineErrors({
  /** Message kept as `@fastify/sensible`'s default so the 401 body does not change. */
  unauthenticated: {
    code: 'UNAUTHENTICATED',
    kind: 'unauthenticated',
    message: () => 'Unauthorized',
  },
  rateLimited: {
    code: 'RATE_LIMITED',
    kind: 'rate_limited',
    message: () => 'Too many requests',
  },
  /** Fallback for a Prisma P2025 that escaped a repository. A repository should return null instead. */
  recordNotFound: {
    code: 'NOT_FOUND',
    kind: 'not_found',
    message: () => 'Not found',
  },
  /** Fallback for a Prisma P2002. */
  conflict: {
    code: 'CONFLICT',
    kind: 'conflict',
    message: () => 'Conflict',
  },
  routeNotFound: {
    code: 'ROUTE_NOT_FOUND',
    kind: 'not_found',
    message: (p: {method: string; url: string}) =>
      `Route ${p.method}:${p.url} not found`,
  },
});
