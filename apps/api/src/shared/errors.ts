export type ErrorKind =
  | 'invalid'
  | 'unauthenticated'
  | 'forbidden'
  | 'not_found'
  | 'conflict'
  | 'unprocessable'
  | 'rate_limited'
  | 'internal';

export class AppError extends Error {
  override readonly name = 'AppError';
  readonly code: string;
  readonly kind: ErrorKind;

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
  readonly code: string;
  readonly kind: ErrorKind;
  readonly message: (params: P) => string;
}

export type ErrorFactory<P> = ((
  ...args: [P] extends [void] ? [] : [params: P]
) => AppError) & {
  readonly code: string;
  is(error: unknown): error is AppError;
};

type ParamsOf<S> = S extends {message: (params: infer P) => string}
  ? unknown extends P
    ? void
    : P
  : never;

const catalog = new Map<string, ErrorKind>();

export function defineErrors<
  const D extends Readonly<Record<string, ErrorSpec<never>>>,
>(specs: D): {readonly [K in keyof D]: ErrorFactory<ParamsOf<D[K]>>} {
  const factories = Object.fromEntries(
    Object.entries(specs).map(([key, spec]) => {
      if (catalog.has(spec.code))
        throw new Error(`Error code ${spec.code} is defined twice (${key}).`);
      catalog.set(spec.code, spec.kind);
      const factory = Object.assign(
        (params: unknown) =>
          new AppError({
            code: spec.code,
            kind: spec.kind,
            message: spec.message(params as never),
          }),
        {
          code: spec.code,
          is: (error: unknown): error is AppError =>
            error instanceof AppError && error.code === spec.code,
        },
      );
      return [key, factory];
    }),
  );
  return factories as unknown as {
    readonly [K in keyof D]: ErrorFactory<ParamsOf<D[K]>>;
  };
}

export const CommonErrors = defineErrors({
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
  recordNotFound: {
    code: 'NOT_FOUND',
    kind: 'not_found',
    message: () => 'Not found',
  },
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
