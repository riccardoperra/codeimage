import type {Static} from '@sinclair/typebox';
import {Type} from '@sinclair/typebox';
import {Value} from '@sinclair/typebox/value';

export const TabMarksSchema = Type.Object({
  lines: Type.Array(
    Type.Object({
      line: Type.Integer({minimum: 1}),
      kind: Type.Union([
        Type.Literal('added'),
        Type.Literal('removed'),
        Type.Literal('highlight'),
      ]),
    }),
  ),
  focus: Type.Boolean(),
});

export type TabMarks = Static<typeof TabMarksSchema>;

export function parseTabMarks(value: unknown): TabMarks {
  return Value.Check(TabMarksSchema, value) ? value : {lines: [], focus: false};
}
