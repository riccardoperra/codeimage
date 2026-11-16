import type {Static} from '@sinclair/typebox';
import {Type} from '@sinclair/typebox';

export const TabScriptSchema = Type.Object({
  steps: Type.Array(Type.String({minLength: 1, maxLength: 64}), {
    minItems: 2,
    uniqueItems: true,
  }),
  lines: Type.Array(
    Type.Object({
      line: Type.Integer({minimum: 1}),
      enter: Type.Optional(Type.Integer({minimum: 1})),
      leave: Type.Optional(Type.Integer({minimum: 2})),
      focus: Type.Optional(
        Type.Array(Type.Integer({minimum: 1}), {uniqueItems: true}),
      ),
    }),
  ),
});

export const StepViewSchema = Type.Union([
  Type.Object({kind: Type.Literal('tab')}),
  Type.Object({
    kind: Type.Literal('diff'),
    side: Type.Union([Type.Literal('before'), Type.Literal('after')]),
  }),
  Type.Object({kind: Type.Literal('script'), step: Type.Integer({minimum: 1})}),
]);

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
  focusedLines: Type.Array(Type.Integer({minimum: 1})),
  script: Type.Optional(TabScriptSchema),
});

export type TabMarks = Static<typeof TabMarksSchema>;

export const AnimationEasingSchema = Type.Union([
  Type.Literal('smooth'),
  Type.Literal('snappy'),
  Type.Literal('strong'),
  Type.Literal('linear'),
  Type.String({
    pattern:
      '^cubic-bezier\\((?:0(?:\\.\\d{1,3})?|1(?:\\.0{1,3})?), (?:0(?:\\.\\d{1,3})?|1(?:\\.0{1,3})?), (?:0(?:\\.\\d{1,3})?|1(?:\\.0{1,3})?), (?:0(?:\\.\\d{1,3})?|1(?:\\.0{1,3})?)\\)$',
    maxLength: 64,
  }),
]);

export const AnimationSettingsSchema = Type.Object({
  steps: Type.Array(
    Type.Object({
      id: Type.Optional(Type.String({minLength: 1, maxLength: 64})),
      transition: Type.Optional(
        Type.Object({
          ms: Type.Integer({minimum: 1}),
          easing: AnimationEasingSchema,
        }),
      ),
      editorId: Type.String(),
      view: Type.Optional(StepViewSchema),
      holdMs: Type.Integer({minimum: 0}),
    }),
    {minItems: 1},
  ),
  transitionMs: Type.Integer({minimum: 1}),
  easing: AnimationEasingSchema,
  header: Type.Optional(
    Type.Object({
      mode: Type.Union([
        Type.Literal('tab'),
        Type.Literal('title'),
        Type.Literal('tabs'),
      ]),
      title: Type.String({maxLength: 80}),
    }),
  ),
  fps: Type.Union([
    Type.Literal(24),
    Type.Literal(30),
    Type.Literal(50),
    Type.Literal(60),
  ]),
});

export type AnimationSettings = Static<typeof AnimationSettingsSchema>;
