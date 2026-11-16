import Fastify from 'fastify';
import {Type} from '@sinclair/typebox';
import {Value} from '@sinclair/typebox/value';
import {expect, test} from 'vitest';
import {
  type AnimationSettings,
  AnimationSettingsSchema,
  TabMarksSchema,
  ProjectUpdateRequestSchema,
} from '../../../../src/modules/project/project.contract.js';
import {
  changesFromUpdateBody,
  draftFromClone,
  parseAnimationSettings,
  remapAnimationStep,
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
      surface: 'solid',
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

test('new timing, ids, repeated tabs and headers survive boundary parsing', () => {
  const next = {
    ...animation,
    header: {mode: 'title', title: 'Example'},
    steps: [
      {id: 'one', editorId: 'a', holdMs: 0},
      {
        id: 'two',
        editorId: 'a',
        holdMs: 0,
        transition: {ms: 701, easing: 'cubic-bezier(0.25, 0.1, 0.25, 1)'},
      },
    ],
  };
  expect(parseAnimationSettings(next)).toEqual(next);
  expect(parseAnimationSettings({...next, steps: [next.steps[0]]})).toBeNull();
});

test('tab and diff timing ids follow assigned tab ids while script ids remain stable', () => {
  const ids = new Map([['local', 'stored']]);
  expect(
    remapAnimationStep({id: 'local', editorId: 'local', holdMs: 800}, ids).id,
  ).toBe('stored');
  expect(
    remapAnimationStep(
      {
        id: 'local:after',
        editorId: 'local',
        view: {kind: 'diff', side: 'after'},
        holdMs: 800,
      },
      ids,
    ).id,
  ).toBe('stored:after');
  expect(
    remapAnimationStep(
      {
        id: 'local',
        editorId: 'local',
        view: {kind: 'script', step: 1},
        holdMs: 800,
      },
      ids,
    ),
  ).toEqual({
    id: 'local',
    editorId: 'stored',
    view: {kind: 'script', step: 1},
    holdMs: 800,
  });
});

test('Fastify response serialization keeps script ranges and step views', async t => {
  const app = Fastify();
  t.onTestFinished(() => app.close());
  const snapshot = {
    marks: {
      lines: [],
      focusedLines: [],
      script: {
        steps: ['one', 'two'],
        lines: [
          {line: 1, enter: 2},
          {line: 2, leave: 2},
          {line: 3, focus: [2]},
        ],
      },
    },
    animation: {
      ...animation,
      steps: [
        {
          id: 'two',
          editorId: 'a',
          holdMs: 800,
          view: {kind: 'script', step: 2},
        },
      ],
    },
  };
  app.get(
    '/',
    {
      schema: {
        response: {
          200: Type.Object({
            marks: TabMarksSchema,
            animation: AnimationSettingsSchema,
          }),
        },
      },
    },
    async () => snapshot,
  );
  const response = await app.inject('/');
  expect(response.statusCode).toBe(200);
  expect(response.json()).toEqual(snapshot);
});
