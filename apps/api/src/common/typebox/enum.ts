import {TString, Type, Static} from '@sinclair/typebox';
import {Nullable} from './nullable.js';

export const enumLiteral = <T extends string>(values: T[]): TString => {
  const literals = values.map(value => Type.Literal(value));
  // TODO: validation should work but type must work as a string...
  return Type.Intersect([
    Type.Union(literals),
    Type.String(),
  ]) as unknown as TString;
};

const x = Type.Object({
  data: Nullable(enumLiteral(['test', 'ciao'] as const)),
});

declare const xs: Static<typeof x>;

xs.data;

export function data(s: string | null) {}

data(xs.data);
