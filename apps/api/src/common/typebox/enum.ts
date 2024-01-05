import {Type} from '@sinclair/typebox';

export const enumLiteral = <T extends readonly string[]>(values: [...T]) => {
  const literals = values.map(value => Type.Literal(value));
  // TODO: validation should work but type must work as a string...
  return Type.Intersect([Type.Union(literals), Type.String()]);
};
