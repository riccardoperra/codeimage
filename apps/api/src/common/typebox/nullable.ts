import {SchemaOptions, TSchema, Type} from '@sinclair/typebox';

export const Nullable = <T extends TSchema>(tType: T, optional = true) => {
  const options: SchemaOptions | undefined = Reflect.has(tType, 'default')
    ? {default: tType.default}
    : undefined;

  const resolvedType = Type.Union([tType, Type.Null()], options);

  if (optional) {
    return Type.Optional(resolvedType);
  }
  return resolvedType;
};
