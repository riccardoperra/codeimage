/**
 * HTTP contracts as plain data.
 *
 * A module's `<name>.contract.ts` declares its operations: method, url, TypeBox schema and the auth
 * mode. The same object serves three readers:
 *   1. routes spread it into `fastify.route({...op, handler})` (validation, serialization, typing);
 *   2. @fastify/swagger documents it;
 *   3. `src/api-types.ts` derives the client types from it (`ApiTypesOf`).
 *
 * Closure rule (architecture test): this file, every `*.contract.ts` and `api-types.ts` import only
 * `@sinclair/typebox`, other contract files and this file. That keeps the type closure the frontend
 * compiles small and free of Fastify and Prisma.
 */
import type {SchemaOptions, Static, TSchema, TString} from '@sinclair/typebox';
import {Type} from '@sinclair/typebox';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

/** Default 'required'. 'optional' hands the handler a Principal that may be anonymous. */
export type AuthMode = 'required' | 'optional';

/** Route policy. Travels as Fastify route `config` (see shared/http.ts). */
export interface OperationConfig {
  readonly auth?: AuthMode;
}

export interface OperationSchema {
  readonly summary?: string;
  readonly description?: string;
  readonly tags?: readonly string[];
  readonly operationId?: string;
  readonly params?: TSchema;
  readonly querystring?: TSchema;
  readonly headers?: TSchema;
  readonly body?: TSchema;
  /** Every operation documents its 200. Errors share ErrorEnvelopeSchema (added by http/app-api.ts). */
  readonly response: {readonly 200: TSchema};
}

export interface Operation {
  readonly method: HttpMethod;
  readonly url: `/${string}`;
  readonly schema: OperationSchema;
  readonly config?: OperationConfig;
}

export type Contract = Readonly<Record<string, Operation>>;

/**
 * Identity for types. At runtime it fills `schema.tags = [tag]` and `schema.operationId = '<tag>.<key>'`
 * where a contract left them out. The key is the operation's one name: service method, client type key
 * and OpenAPI operationId all follow it.
 */
export function defineContract<const C extends Contract>(
  tag: string,
  operations: C,
): C {
  // TODO
  // for (const [key, op] of Object.entries(operations)):
  //   Object.assign(op.schema, {tags: op.schema.tags ?? [tag], operationId: op.schema.operationId ?? `${tag}.${key}`})
  // return operations
  // Mutating is safe: contracts are module-level constants evaluated once.
  void tag;
  void operations;
  throw new Error('not implemented');
}

// ---------------------------------------------------------------------------------------------
// Client types. Same semantics as today's GetApiTypes (every request part optional, response is
// the 200 entry), so `ApiTypes.X['request']['params']?.id` keeps compiling in apps/codeimage.
// ---------------------------------------------------------------------------------------------

type StaticOr<T> = T extends TSchema ? Static<T> : T;

export interface ApiTypes<S extends OperationSchema> {
  request: {
    body?: StaticOr<S['body']>;
    querystring?: StaticOr<S['querystring']>;
    params?: StaticOr<S['params']>;
    headers?: StaticOr<S['headers']>;
  };
  response: S['response'] extends {200: infer R} ? StaticOr<R> : never;
}

/** `ApiTypesOf<typeof presetContract>['create']['response']`. A new operation appears with no edit. */
export type ApiTypesOf<C extends Contract> = {
  readonly [K in keyof C]: ApiTypes<C[K]['schema']>;
};

// ---------------------------------------------------------------------------------------------
// The error envelope. A superset of today's `{statusCode, error, message, code?}` so existing
// clients keep parsing it.
// ---------------------------------------------------------------------------------------------

export const ErrorEnvelopeSchema = Type.Object(
  {
    statusCode: Type.Integer(),
    /** HTTP reason phrase, e.g. "Not Found". */
    error: Type.String(),
    message: Type.String(),
    /** Stable machine-readable code from an error catalog. Branch on this. */
    code: Type.String(),
    /** Same value as the `request-id` response header and the log line's reqId. */
    requestId: Type.String(),
    /** Field-level problems of a request validation failure. */
    details: Type.Optional(
      Type.Array(Type.Object({path: Type.String(), message: Type.String()})),
    ),
  },
  {$id: 'ErrorEnvelope', title: 'ErrorEnvelope'},
);
export type ErrorEnvelope = Static<typeof ErrorEnvelopeSchema>;

// ---------------------------------------------------------------------------------------------
// TypeBox helpers moved verbatim from src/common/typebox/*.
// ---------------------------------------------------------------------------------------------

export const Nullable = <T extends TSchema>(tType: T, optional = true) => {
  const options: SchemaOptions | undefined = Reflect.has(tType, 'default')
    ? {default: tType.default}
    : undefined;
  const resolvedType = Type.Union([tType, Type.Null()], options);
  return optional ? Type.Optional(resolvedType) : resolvedType;
};

export const enumLiteral = <T extends string>(values: T[]): TString =>
  Type.Intersect([
    Type.Union(values.map(value => Type.Literal(value))),
    Type.String(),
  ]) as unknown as TString;
