import assert from 'node:assert/strict';
import {test} from 'vitest';
import {parseHtml, styleAt} from './test-utils';
import {
  frameRules,
  planTimeline,
  type StepLayout,
  type Timeline,
  type TimelineScene,
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
    ['transition', 0, 451, 0],
    ['transition', 1, 450, 451],
    ['hold', 1, 300, null],
  ]);
});

test('leaves out holds of 0 ms', () => {
  const timeline = planTimeline(
    [step('a', 0), step('b', 500), step('a', 0)],
    options,
  );
  assert.deepEqual(order(timeline), [
    ['transition', 0, 451, 0],
    ['transition', 1, 450, 451],
    ['hold', 1, 500, null],
    ['transition', 1, 451, 0],
    ['transition', 2, 450, 451],
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

// Where the frame of `scene` is at `timeMs` into the scene, with its center.
function frameAt(timeline: Timeline, scene: TimelineScene, timeMs: number) {
  const rules = frameRules(scene, {frame: '#frame', window: '#window'});
  const declarations = Array.from(
    rules.matchAll(/#frame\{([^}]*)\}/g),
    ([, body]) => body,
  ).join(';');
  const [frame] = parseHtml(`<div style="${declarations}"></div>`).children;
  const {translateX, translateY, width, height} = styleAt(
    frame,
    timeline.css,
    timeMs,
  );
  return {
    x: translateX,
    y: translateY,
    width,
    height,
    center: {x: translateX + width / 2, y: translateY + height / 2},
  };
}

test('the video is the largest frame, and each frame sits centered on whole pixels', () => {
  const timeline = planTimeline(
    [step('a', 500, natural(400, 250)), step('b', 500, natural(501.4, 300.6))],
    options,
  );
  assert.deepEqual([timeline.width, timeline.height], [501, 301]);
  const [first, , , last] = timeline.scenes;
  assert.deepEqual(frameAt(timeline, first, 0), {
    x: 50,
    y: 25,
    width: 400,
    height: 250,
    center: {x: 250, y: 150},
  });
  assert.deepEqual(frameAt(timeline, last, 0), {
    x: 0,
    y: 0,
    width: 501.4,
    height: 300.6,
    center: {x: 250.7, y: 150.3},
  });
});

test('a frame that grows stays centered and ends where each hold puts it', () => {
  const timeline = planTimeline(
    [step('a', 500, natural(466, 267)), step('a\nb', 500, natural(516, 715))],
    options,
  );
  const [first, early, late, last] = timeline.scenes;
  assert.ok(early.kind === 'transition' && late.kind === 'transition');
  assert.deepEqual(frameAt(timeline, early, 0), frameAt(timeline, first, 0));
  assert.deepEqual(
    frameAt(timeline, late, late.durationMs),
    frameAt(timeline, last, 0),
  );
  for (const progress of [0.25, 0.5, 0.75]) {
    const timeMs = progress * options.transitionMs;
    const scene = timeMs < late.offsetMs ? early : late;
    const {center} = frameAt(timeline, scene, timeMs - scene.offsetMs);
    assert.ok(
      Math.abs(center.x - timeline.width / 2) <= 0.5 &&
        Math.abs(center.y - timeline.height / 2) <= 0.5,
      `center ${center.x},${center.y} at ${progress}`,
    );
  }
});

test('a single step is one hold', () => {
  const timeline = planTimeline([step('a', 500, natural(400, 200))], options);
  assert.deepEqual(order(timeline), [['hold', 0, 500, null]]);
  assert.deepEqual([timeline.width, timeline.height], [400, 200]);
});

test('a single step held for 0 ms has no scenes', () => {
  const timeline = planTimeline([step('a', 0)], options);
  assert.deepEqual(order(timeline), []);
});

test('the first frame of a 1 ms transition shows the step it leaves', () => {
  const timeline = planTimeline([step('a'), step('b', 300)], {
    ...options,
    transitionMs: 1,
  });
  assert.deepEqual(order(timeline), [
    ['hold', 0, 500, null],
    ['transition', 0, 1, 0],
    ['hold', 1, 300, null],
  ]);
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
