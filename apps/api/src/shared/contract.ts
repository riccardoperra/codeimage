import type {SchemaOptions, Static, TSchema, TString} from '@sinclair/typebox';
import {Type} from '@sinclair/typebox';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export type AuthMode = 'required' | 'optional';

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
  readonly response: {readonly 200: TSchema};
}

export interface Operation {
  readonly method: HttpMethod;
  readonly url: `/${string}`;
  readonly schema: OperationSchema;
  readonly config?: OperationConfig;
}

export type Contract = Readonly<Record<string, Operation>>;

export function defineContract<const C extends Contract>(
  tag: string,
  operations: C,
): C {
  for (const [key, op] of Object.entries(operations)) {
    Object.assign(op.schema, {
      tags: op.schema.tags ?? [tag],
      operationId: op.schema.operationId ?? `${tag}.${key}`,
    });
  }
  return operations;
}

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

export type ApiTypesOf<C extends Contract> = {
  readonly [K in keyof C]: ApiTypes<C[K]['schema']>;
};

export const ErrorEnvelopeSchema = Type.Object(
  {
    statusCode: Type.Integer(),
    error: Type.String(),
    message: Type.String(),
    code: Type.String(),
    requestId: Type.String(),
    details: Type.Optional(
      Type.Array(Type.Object({path: Type.String(), message: Type.String()})),
    ),
  },
  {$id: 'ErrorEnvelope', title: 'ErrorEnvelope'},
);
export type ErrorEnvelope = Static<typeof ErrorEnvelopeSchema>;

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
