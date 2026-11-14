import assert from 'node:assert/strict';
import {test} from 'vitest';
import {
  planTimeline,
  type StepLayout,
  type Timeline,
  type TimelineStep,
  type WindowPlacement,
} from './timeline';

const options = {
  transitionMs: 901,
  easing: 'linear',
  lineNumbers: false,
  metrics: {charWidth: 10, lineHeight: 20},
  widths: new Map(),
} as const;

const natural = (width: number, height: number): StepLayout => ({
  size: {width, height},
  window: null,
});

const step = (
  code: string,
  holdMs = 500,
  layout = natural(400, 200),
): TimelineStep => ({
  lines: code.split('\n').map(text => (text ? [{text, classes: ''}] : [])),
  marks: {lines: [], focusedLines: []},
  lineNumberStart: 1,
  layout,
  holdMs,
});

const order = (timeline: Timeline) =>
  timeline.scenes.map(scene => [
    scene.kind,
    scene.step,
    scene.durationMs,
    scene.kind === 'transition' ? scene.offsetMs : null,
  ]);

test('holds each step and switches the active step halfway through a transition', () => {
  const timeline = planTimeline([step('a'), step('b', 300)], options);
  assert.deepEqual(order(timeline), [
    ['hold', 0, 500, null],
    ['transition', 0, 450, 0],
    ['transition', 1, 451, 450],
    ['hold', 1, 300, null],
  ]);
});

test('leaves out holds of 0 ms', () => {
  const timeline = planTimeline(
    [step('a', 0), step('b', 500), step('a', 0)],
    options,
  );
  assert.deepEqual(order(timeline), [
    ['transition', 0, 450, 0],
    ['transition', 1, 451, 450],
    ['hold', 1, 500, null],
    ['transition', 1, 450, 0],
    ['transition', 2, 451, 450],
  ]);
});

test('both halves of a transition draw the tokens of both steps', () => {
  const [, early, late] = planTimeline([step('a'), step('b')], options).scenes;
  for (const scene of [early, late]) {
    assert.ok(scene.kind === 'transition');
    assert.match(scene.code, />a<\/span>/);
    assert.match(scene.code, />b<\/span>/);
  }
});

test('every animation a scene plays has its keyframes', () => {
  const timeline = planTimeline(
    [step('a', 500, natural(300, 200)), step('a\nb'), step('b')],
    {...options, lineNumbers: true},
  );
  const names = timeline.scenes.flatMap(scene =>
    scene.kind === 'transition'
      ? [scene.code, scene.frame.animation].flatMap(text =>
          Array.from(text.matchAll(/animation:(\S+)/g), match => match[1]),
        )
      : [],
  );
  assert.ok(names.length > 0);
  for (const name of names) {
    assert.ok(timeline.css.includes(`@keyframes ${name}{`), name);
  }
});

test('the video is the largest frame, and each frame sits centered on whole pixels', () => {
  const timeline = planTimeline(
    [step('a', 500, natural(400, 250)), step('b', 500, natural(501.4, 300.6))],
    options,
  );
  assert.deepEqual([timeline.width, timeline.height], [501, 301]);
  const [first, early, , last] = timeline.scenes;
  assert.ok(first.kind === 'hold' && last.kind === 'hold');
  assert.deepEqual(first.frame.offset, {x: 50, y: 25});
  assert.deepEqual(last.frame.offset, {x: 0, y: 0});
  assert.ok(early.kind === 'transition' && early.frame.kind === 'slide');
  assert.deepEqual(
    [early.frame.from, early.frame.to],
    [
      {x: 50, y: 25},
      {x: 0, y: 0},
    ],
  );
});

test('an export target keeps its frame and moves the window', () => {
  const target = (window: WindowPlacement): StepLayout => ({
    size: {width: 1600, height: 900},
    window,
  });
  const small = {left: 500, top: 300, width: 600, height: 300, scale: 1};
  const fitted = {left: 64, top: 64, width: 2000, height: 1000, scale: 0.736};
  const timeline = planTimeline(
    [step('a', 500, target(small)), step('b', 500, target(fitted))],
    options,
  );
  assert.deepEqual([timeline.width, timeline.height], [1600, 900]);
  const [hold, early] = timeline.scenes;
  assert.ok(hold.kind === 'hold');
  assert.deepEqual(hold.frame, {...target(small), offset: {x: 0, y: 0}});
  assert.ok(early.kind === 'transition' && early.frame.kind === 'window');
  assert.deepEqual(early.frame.size, {width: 1600, height: 900});
  assert.deepEqual([early.frame.from, early.frame.to], [small, fitted]);
});
