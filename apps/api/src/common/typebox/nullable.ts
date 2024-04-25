import {
  SchemaOptions,
  TNull,
  TOptional,
  TSchema,
  TUnion,
  Type,
} from '@sinclair/typebox';

export function Nullable<T extends TSchema>(
  tType: T,
  optional?: true,
): TOptional<TUnion<[T, TNull]>>;
export function Nullable<T extends TSchema>(
  tType: T,
  optional?: false,
): TUnion<[T, TNull]>;
export function Nullable<T extends TSchema>(
  tType: T,
  optional?: boolean,
): TOptional<TUnion<[T, TNull]>> | TUnion<[T, TNull]> {
  const options: SchemaOptions | undefined = Reflect.has(tType, 'default')
    ? {default: tType.default}
    : undefined;

  const resolvedType = Type.Union([tType, Type.Null()], options);

  if (optional === undefined || optional) {
    return Type.Optional(resolvedType);
  }
  return resolvedType;
}
