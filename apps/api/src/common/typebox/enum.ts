import {TString, Type} from '@sinclair/typebox';

export const enumLiteral = <T extends string>(values: T[]): TString => {
  const literals = values.map(value => Type.Literal(value));
  // TODO: validation should work but type must work as a string...
  return Type.Intersect([
    Type.Union(literals),
    Type.String(),
  ]) as unknown as TString;
};
