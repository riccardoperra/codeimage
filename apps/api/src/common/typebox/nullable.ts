import {SchemaOptions, TSchema, Type} from '@sinclair/typebox';

export const Nullable = <T extends TSchema>(tType: T) => {
  const options: SchemaOptions | undefined = Reflect.has(tType, 'default')
    ? {default: tType.default}
    : undefined;
  return Type.Optional(Type.Union([tType, Type.Null()], options));
};
