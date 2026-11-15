import assert from 'node:assert/strict';
import {test} from 'vitest';
import {planTimeline} from '@core/animation/timeline';
import {easingOf} from '@core/animation/easing';
import {
  parseAnimationSettings,
  parseDraft,
  seedSteps,
  segmentsOf,
  stepAt,
} from './animationSettings';

const step = (editorId: string, holdMs = 800) => ({editorId, holdMs});
test('legacy ids are deterministic, repeats survive and new tabs never join', () => {
  const saved = {steps: [step('b'), step('a'), step('b'), step('missing')]};
  const settings = parseAnimationSettings(saved, ['a', 'b', 'c']);
  assert.deepEqual(
    settings.steps.map(s => [s.id, s.editorId]),
    [
      ['b', 'b'],
      ['a', 'a'],
      ['b~2', 'b'],
    ],
  );
  assert.deepEqual(parseAnimationSettings(settings, ['a', 'b', 'c']), settings);
  assert.deepEqual(
    seedSteps(['a', 'b']).map(s => s.id),
    ['a', 'b'],
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
    ['a', 'b'],
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
    parseAnimationSettings({steps: [step('a', 0)]}, ['a']).steps,
    [{id: 'a', editorId: 'a', holdMs: 800}],
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
        step('a', 0),
      ],
      transitionMs: 103,
    },
    ['a', 'b'],
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
  assert.equal(segmentsOf(settings).at(-1)?.startMs, start);
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
