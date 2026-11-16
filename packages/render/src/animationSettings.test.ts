import {fileURLToPath} from 'node:url';
import {describe, expect, it} from 'vitest';
import {parseAnimationSettings} from './animationSettings';

const EDITOR = fileURLToPath(
  new URL(
    '../../../apps/codeimage/src/state/editor/animationSettings.ts',
    import.meta.url,
  ),
);
const {parseDraft, reconcileSteps, seedSteps} = (await import(EDITOR)) as {
  parseDraft(value: unknown): {steps: readonly unknown[]};
  seedSteps(editorIds: string[]): unknown[];
  reconcileSteps(draft: unknown, editorIds: readonly string[]): unknown;
};

const tabs = ['a', 'b', 'c'] as const;

function editorSettings(value: unknown) {
  const draft = parseDraft(value);
  return reconcileSteps(
    draft.steps.length ? draft : {...draft, steps: seedSteps([...tabs])},
    tabs,
  );
}

const cases: [string, unknown][] = [
  ['nothing stored', undefined],
  ['a non-object', 'smooth'],
  ['no steps', {steps: [], transitionMs: 300}],
  [
    'what the editor saves',
    {
      steps: [
        {id: 'a', editorId: 'a', holdMs: 800},
        {
          id: 'b',
          editorId: 'b',
          holdMs: 1200,
          transition: {ms: 450, easing: 'strong'},
        },
        {
          id: 'a~2',
          editorId: 'a',
          holdMs: 0,
          transition: {ms: 900, easing: 'cubic-bezier(0.1, 0.2, 0.3, 1)'},
        },
      ],
      transitionMs: 700,
      easing: 'snappy',
      fps: 50,
      header: {mode: 'tabs', title: ''},
    },
  ],
  [
    'a project from before step ids and headers',
    {
      steps: [
        {editorId: 'c', holdMs: 400},
        {editorId: 'c', holdMs: 500},
      ],
      transitionMs: 900,
      easing: 'linear',
      fps: 24,
    },
  ],
  [
    'values out of range',
    {
      steps: [
        {editorId: 'a', holdMs: -5},
        {
          editorId: 'b',
          holdMs: 99_999.6,
          transition: {ms: 1, easing: 'linear'},
        },
        {editorId: 'c', holdMs: 10.4, transition: {ms: 1e9, easing: 'snappy'}},
      ],
      transitionMs: 50,
    },
  ],
  [
    'invalid values',
    {
      steps: [
        {editorId: 'a', holdMs: '100', id: ''},
        {editorId: 'b', holdMs: null, id: 'x'.repeat(65)},
        {editorId: 3, holdMs: 100},
        {editorId: 'gone', holdMs: 100},
        {editorId: 'c', transition: {ms: 300, easing: 'bounce'}},
        {editorId: 'c', transition: {ms: '300', easing: 'smooth'}},
      ],
      transitionMs: Number.NaN,
      easing: 'cubic-bezier(1.5, 0, 0, 1)',
      fps: 25,
      header: {mode: 'all', title: 42},
    },
  ],
  [
    'easings written by hand',
    {
      steps: [
        {editorId: 'a', holdMs: 100},
        {
          editorId: 'b',
          holdMs: 100,
          transition: {ms: 300, easing: ' 0.2, 0, 0, 1 '},
        },
        {
          editorId: 'c',
          holdMs: 100,
          transition: {ms: 300, easing: 'cubic-bezier(.12345, -2, 1, 3)'},
        },
      ],
      easing: 'cubic-bezier(0.65,0,0.35,1)',
      header: {mode: 'title', title: `  ${'t'.repeat(100)}  `},
    },
  ],
  ...[
    '0.65, 0, 0.35, 1',
    '0.2, 0, 0, 1',
    '0.77, 0, 0.175, 1',
    '0, 0, 1, 1',
    '0.77, 0, 0.1749, 1',
  ].map((curve): [string, unknown] => [
    `the curve ${curve}`,
    {
      steps: [
        {editorId: 'a', holdMs: 100},
        {editorId: 'b', holdMs: 100, transition: {ms: 300, easing: curve}},
      ],
      easing: `cubic-bezier(${curve})`,
    },
  ]),
  ['only gone tabs', {steps: [{editorId: 'gone', holdMs: 0}]}],
  ['a lone step held for 0 ms', {steps: [{editorId: 'b', holdMs: 0}]}],
];

describe('the render package reads Animate settings as the editor does', () => {
  it.each(cases)('%s', (_, value) => {
    expect(parseAnimationSettings(value, tabs)).toEqual(editorSettings(value));
  });
});
