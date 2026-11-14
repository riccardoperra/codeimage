import type {Static} from '@sinclair/typebox';
import {Type} from '@sinclair/typebox';
import {Value} from '@sinclair/typebox/value';

const LineMarksSchema = Type.Array(
  Type.Object({
    line: Type.Integer({minimum: 1}),
    kind: Type.Union([
      Type.Literal('added'),
      Type.Literal('removed'),
      Type.Literal('highlight'),
    ]),
  }),
);

export const TabMarksSchema = Type.Object({
  lines: LineMarksSchema,
  focusedLines: Type.Array(Type.Integer({minimum: 1})),
});

const LegacyTabMarksSchema = Type.Object({
  lines: LineMarksSchema,
  focus: Type.Boolean(),
});

export type TabMarks = Static<typeof TabMarksSchema>;

/** Normalize persisted JSON from before focus became an independent line mark. */
export function parseTabMarks(value: unknown): TabMarks {
  if (Value.Check(TabMarksSchema, value)) return value;
  if (Value.Check(LegacyTabMarksSchema, value)) {
    return {
      lines: value.lines,
      focusedLines: value.focus
        ? [
            ...new Set(
              value.lines
                .filter(mark => mark.kind === 'highlight')
                .map(mark => mark.line),
            ),
          ]
        : [],
    };
  }
  return {lines: [], focusedLines: []};
}
