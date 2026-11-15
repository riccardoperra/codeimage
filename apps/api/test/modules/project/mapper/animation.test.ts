import {Value} from '@sinclair/typebox/value';
import {expect, test} from 'vitest';
import {
  type AnimationSettings,
  ProjectUpdateRequestSchema,
} from '../../../../src/modules/project/project.contract.js';
import {
  changesFromUpdateBody,
  draftFromClone,
  parseAnimationSettings,
  type Project,
} from '../../../../src/modules/project/project.model.js';
import {asUserId} from '../../../../src/shared/principal.js';

const animation: AnimationSettings = {
  steps: [
    {editorId: 'b', holdMs: 400},
    {editorId: 'a', holdMs: 0},
  ],
  transitionMs: 900,
  easing: 'snappy',
  fps: 60,
};

const tab = (id: string) => ({
  id,
  code: id,
  languageId: 'typescript',
  tabName: `${id}.ts`,
  lineNumberStart: 1,
});

const body = {
  frame: {
    background: '#fff',
    opacity: 100,
    visible: true,
    radius: 0,
    padding: 0,
  },
  editors: [tab('a'), tab('b')],
  editorOptions: {
    fontWeight: 400,
    showLineNumbers: false,
    fontId: 'jetbrains-mono',
    themeId: 'vscode',
    enableLigatures: true,
  },
  terminal: {
    opacity: 100,
    background: null,
    textColor: null,
    showWatermark: false,
    showHeader: true,
    showGlassReflection: false,
    shadow: null,
    alternativeTheme: false,
    accentVisible: false,
    type: 'macOS',
    borderType: null,
  },
};

test('an update carries the animation, and leaves it alone without one', () => {
  expect(Value.Check(ProjectUpdateRequestSchema, {...body, animation})).toBe(
    true,
  );
  expect(changesFromUpdateBody({...body, animation}).animation).toEqual(
    animation,
  );
  expect(Value.Check(ProjectUpdateRequestSchema, body)).toBe(true);
  expect(changesFromUpdateBody(body).animation).toBeUndefined();
});

test('rejects fractional durations and unknown easings or frame rates', () => {
  for (const invalid of [
    {...animation, transitionMs: 900.5},
    {...animation, steps: [{editorId: 'a', holdMs: 0.5}]},
    {...animation, transitionMs: 0},
    {...animation, steps: []},
    {...animation, easing: 'bounce'},
    {...animation, fps: 25},
  ]) {
    expect(
      Value.Check(ProjectUpdateRequestSchema, {...body, animation: invalid}),
    ).toBe(false);
    expect(parseAnimationSettings(invalid)).toBeNull();
  }
});

test('an animation of 0 ms is no animation', () => {
  const still = {...animation, steps: [{editorId: 'a', holdMs: 0}]};
  expect(parseAnimationSettings(still)).toBeNull();
  expect(
    changesFromUpdateBody({...body, animation: still}).animation,
  ).toBeUndefined();
});

test('projects saved without an animation load without one', () => {
  expect(parseAnimationSettings(null)).toBeNull();
  expect(parseAnimationSettings(undefined)).toBeNull();
});

test('a clone points its animation steps at its own tabs', () => {
  const source: Project = {
    id: 'source',
    ownerId: asUserId('owner'),
    name: 'Source',
    createdAt: new Date(),
    updatedAt: new Date(),
    frame: {
      id: 'frame',
      background: null,
      padding: 32,
      radius: 24,
      visible: true,
      opacity: 100,
    },
    terminal: {
      id: 'terminal',
      showHeader: true,
      type: 'macOS',
      accentVisible: true,
      shadow: null,
      background: null,
      textColor: null,
      showWatermark: true,
      showGlassReflection: false,
      opacity: 100,
      alternativeTheme: false,
      borderType: null,
    },
    editorOptions: {
      id: 'options',
      fontId: 'jetbrains-mono',
      fontWeight: 400,
      showLineNumbers: false,
      themeId: 'vscode',
      enableLigatures: true,
    },
    editorTabs: ['a', 'b'].map(id => ({
      ...tab(id),
      projectId: 'source',
      marks: {lines: [], focusedLines: []},
    })),
    animation,
  };
  const ids = ['new-a', 'new-b'];
  const draft = draftFromClone(source, null, () => ids.shift()!);
  expect(draft.editorTabs.map(tab => [tab.id, tab.code])).toEqual([
    ['new-a', 'a'],
    ['new-b', 'b'],
  ]);
  expect(draft.animation?.steps).toEqual([
    {editorId: 'new-b', holdMs: 400},
    {editorId: 'new-a', holdMs: 0},
  ]);
});
