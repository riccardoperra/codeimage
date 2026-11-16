import assert from 'node:assert/strict';
import {test} from 'vitest';
import {planTimeline} from '@core/animation/timeline';
import {easingOf} from '@core/animation/easing';
import {
  parseAnimationSettings,
  parseDraft,
  deriveSteps,
  segmentsOf,
  stepAt,
} from './animationSettings';

const step = (editorId: string, holdMs = 800) => ({editorId, holdMs});
const tabs = (...ids: [string, ...string[]]) => {
  const tab = (id: string) => ({id, marks: {lines: [], focusedLines: []}});
  return [tab(ids[0]), ...ids.slice(1).map(tab)] as const;
};
test('migration derives tab order, removes repeats and inserts new tabs while keeping timing by id', () => {
  const saved = {
    steps: [step('b', 450), step('a', 200), step('b', 900), step('missing')],
  };
  const settings = parseAnimationSettings(saved, tabs('a', 'b', 'c'));
  assert.deepEqual(
    settings.steps.map(s => [s.id, s.holdMs]),
    [
      ['a', 200],
      ['b', 450],
      ['c', 800],
    ],
  );
  const reordered = parseAnimationSettings(settings, tabs('c', 'b'));
  assert.deepEqual(
    reordered.steps.map(s => [s.id, s.holdMs]),
    [
      ['c', 800],
      ['b', 450],
    ],
  );
  assert.deepEqual(
    parseAnimationSettings(settings, tabs('a', 'b', 'c')),
    settings,
  );
});
test('scripts and diff marks derive stable step ids and views', () => {
  assert.deepEqual(
    deriveSteps([
      {id: 'a', marks: {lines: [{line: 2, kind: 'added'}], focusedLines: []}},
    ]).map(s => [s.id, s.view]),
    [
      ['a:before', {kind: 'diff', side: 'before'}],
      ['a:after', {kind: 'diff', side: 'after'}],
    ],
  );
  assert.deepEqual(
    deriveSteps([
      {
        id: 'a',
        marks: {
          lines: [],
          focusedLines: [],
          script: {steps: ['one', 'two'], lines: []},
        },
      },
    ]).map(s => [s.id, s.view]),
    [
      ['one', {kind: 'script', step: 1}],
      ['two', {kind: 'script', step: 2}],
    ],
  );
});
test('defaults, field validation, header trimming and bounds', () => {
  assert.equal(parseDraft({}).transitionMs, 700);
  assert.equal(parseDraft({transitionMs: 900}).transitionMs, 900);
  const settings = parseAnimationSettings(
    {
      steps: [
        step('a', -3),
        {...step('b', 99999), transition: {ms: 0, easing: '.25, -2, .3, 8'}},
      ],
      easing: 'spring',
      fps: 25,
      header: {mode: 'title', title: ' hi '},
    },
    tabs('a', 'b'),
  );
  assert.equal(settings.steps[0].holdMs, 0);
  assert.equal(settings.steps[1].holdMs, 10000);
  assert.deepEqual(settings.steps[1].transition, {
    ms: 100,
    easing: 'cubic-bezier(0.25, 0, 0.3, 1)',
  });
  assert.deepEqual(settings.header, {mode: 'title', title: 'hi'});
  assert.equal(settings.easing, 'smooth');
  assert.deepEqual(
    parseAnimationSettings({steps: [step('a', 0)]}, tabs('a')).steps,
    [{id: 'a', editorId: 'a', view: {kind: 'tab'}, holdMs: 800}],
  );
  assert.equal(
    parseDraft({
      steps: [{...step('a'), transition: {ms: 500, easing: 'spring'}}],
    }).steps[0].transition,
    undefined,
  );
});
test('stepAt agrees with scene ownership at every millisecond and boundary', () => {
  const settings = parseAnimationSettings(
    {
      steps: [
        step('a', 0),
        {...step('b', 50), transition: {ms: 101, easing: 'strong'}},
      ],
      transitionMs: 103,
    },
    tabs('a', 'b'),
  );
  const toStep = (s: (typeof settings.steps)[number]) => ({
    lines: [],
    marks: {lines: [], focusedLines: []},
    lineNumberStart: 1,
    layout: {size: {width: 100, height: 100}, window: null},
    holdMs: s.holdMs,
    transition: s.transition && {
      ms: s.transition.ms,
      easing: easingOf(s.transition.easing),
    },
  });
  const [first, ...rest] = settings.steps;
  const timeline = planTimeline([toStep(first), ...rest.map(toStep)], {
    transitionMs: settings.transitionMs,
    easing: easingOf(settings.easing),
    fps: 30,
    lineNumbers: false,
    metrics: {charWidth: 10, lineHeight: 20},
    widths: new Map(),
  });
  let start = 0;
  for (const scene of timeline.scenes) {
    for (let ms = start; ms < start + scene.durationMs; ms++)
      assert.equal(stepAt(settings, ms), scene.step);
    start += scene.durationMs;
  }
  assert.equal(stepAt(settings, start), settings.steps.length - 1);
  const last = segmentsOf(settings).at(-1)!;
  assert.equal(last.startMs + last.durationMs, start);
});

test('a missing or invalid hold defaults independently of a valid step id', () => {
  assert.deepEqual(
    parseDraft({
      steps: [{id: 'kept', editorId: 'a', holdMs: Infinity}, {editorId: 'b'}],
    }).steps,
    [
      {id: 'kept', editorId: 'a', holdMs: 800},
      {id: 'b', editorId: 'b', holdMs: 800},
    ],
  );
});
