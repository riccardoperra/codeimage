import {SchemaOptions, TSchema, Type} from '@sinclair/typebox';

export const Nullable = <T extends TSchema>(type: T, options?: SchemaOptions) =>
  Type.Union([type, Type.Null()], options);
