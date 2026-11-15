import assert from 'node:assert/strict';
import {test} from 'vitest';
import {parseHtml, styleAt} from './test-utils';
import type {Size} from './model';
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
  fps: 30,
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

// The style frameRules gives the frame or its window at `timeMs` into `scene`.
function styleOf(
  timeline: Timeline,
  scene: TimelineScene,
  element: 'frame' | 'window',
  timeMs: number,
) {
  const rules = frameRules(scene, {frame: '#frame', window: '#window'});
  const declarations = Array.from(
    rules.matchAll(new RegExp(`#${element}\\{([^}]*)\\}`, 'g')),
    ([, body]) => body,
  ).join(';');
  const [node] = parseHtml(`<div style="${declarations}"></div>`).children;
  return styleAt(node, timeline.css, timeMs);
}

// Where the frame of `scene` is at `timeMs` into the scene, with its center.
function frameAt(timeline: Timeline, scene: TimelineScene, timeMs: number) {
  const {translateX, translateY, width, height} = styleOf(
    timeline,
    scene,
    'frame',
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

const targetStep = (size: Size, window: WindowPlacement) =>
  step('a', 500, {size, window});

// Centers a window in the frame inside its padding, scaled down to fit, the
// way an export target places it.
function fitted(
  size: Size,
  padding: number,
  [width, height]: readonly [number, number],
) {
  const area = {
    width: size.width - 2 * padding,
    height: size.height - 2 * padding,
  };
  const scale = Math.min(1, area.width / width, area.height / height);
  return {
    left: padding + (area.width - width * scale) / 2,
    top: padding + (area.height - height * scale) / 2,
    width,
    height,
    scale,
  };
}

// The box the window of a two-step timeline shows at `progress` of its
// transition, after its scale.
function visibleWindowAt(timeline: Timeline, progress: number) {
  const [, early, late] = timeline.scenes;
  assert.ok(early.kind === 'transition' && late.kind === 'transition');
  const timeMs = progress * options.transitionMs;
  const scene = timeMs < late.offsetMs ? early : late;
  const {left, top, width, height, scale} = styleOf(
    timeline,
    scene,
    'window',
    timeMs - scene.offsetMs,
  );
  return {left, top, width: width * scale, height: height * scale};
}

const centerOf = (box: {
  left: number;
  top: number;
  width: number;
  height: number;
}) => ({
  x: box.left + box.width / 2,
  y: box.top + box.height / 2,
});

test('a window that rescales stays centered inside the padding of its target frame', () => {
  const square = {width: 1080, height: 1080};
  const landscape = {width: 1600, height: 900};
  const padding = 64;
  for (const [size, from, to] of [
    // One short line to two long ones.
    [square, [480, 117], [2644, 139]],
    // Two lines to 45.
    [landscape, [480, 139], [480, 1101]],
    // 60 short lines to two long ones.
    [square, [480, 1438], [2644, 139]],
  ] as const) {
    const timeline = planTimeline(
      [
        targetStep(size, fitted(size, padding, from)),
        targetStep(size, fitted(size, padding, to)),
      ],
      options,
    );
    for (const progress of [0.25, 0.5, 0.75]) {
      const box = visibleWindowAt(timeline, progress);
      const center = centerOf(box);
      const label = `${to} at ${progress}: ${JSON.stringify(box)}`;
      assert.ok(
        Math.abs(center.x - size.width / 2) <= 0.01 &&
          Math.abs(center.y - size.height / 2) <= 0.01,
        label,
      );
      assert.ok(
        box.left >= padding &&
          box.top >= padding &&
          box.left + box.width <= size.width - padding &&
          box.top + box.height <= size.height - padding,
        label,
      );
    }
  }
});

test('a rescaling window is on its path at every frame an export draws', () => {
  const size = {width: 1080, height: 1080};
  const padding = 64;
  const holdMs = 517;
  // The test player rounds the scale to 6 decimals, which moves the edge of a
  // 2644 px window 0.0014 px. Between two stops the window is 0.017 px off.
  const exact = 0.002;
  for (const fps of [24, 25, 30, 50, 60]) {
    const timeline = planTimeline(
      [
        step('a', holdMs, {size, window: fitted(size, padding, [480, 117])}),
        targetStep(size, fitted(size, padding, [2644, 139])),
      ],
      {...options, fps},
    );
    const [, early, late] = timeline.scenes;
    assert.ok(early.kind === 'transition' && late.kind === 'transition');
    const end = holdMs + options.transitionMs;
    let frames = 0;
    // An export draws frame k at floor(k * 1000 / fps) ms of the timeline.
    for (let frame = 0; Math.floor((frame * 1000) / fps) < end; frame++) {
      const timeMs = Math.floor((frame * 1000) / fps) - holdMs;
      if (timeMs < 0) continue;
      frames++;
      const scene = timeMs < late.offsetMs ? early : late;
      const {left, top, width, height, scale} = styleOf(
        timeline,
        scene,
        'window',
        timeMs - scene.offsetMs,
      );
      const box = {left, top, width: width * scale, height: height * scale};
      const center = centerOf(box);
      const label = `${fps} fps at ${timeMs} ms: ${JSON.stringify(box)}`;
      assert.ok(
        Math.abs(center.x - size.width / 2) <= exact &&
          Math.abs(center.y - size.height / 2) <= exact,
        label,
      );
      assert.ok(
        box.left >= padding - exact &&
          box.left + box.width <= size.width - padding + exact,
        label,
      );
    }
    assert.ok(frames >= 21, `${frames} frames at ${fps} fps`);
  }
});

test('a rescaling window moves its visible center on the easing path between its ends', () => {
  const size = {width: 1600, height: 900};
  const from = {left: 100, top: 100, width: 400, height: 200, scale: 1};
  const to = {left: 500, top: 300, width: 2000, height: 1000, scale: 0.4};
  const timeline = planTimeline(
    [targetStep(size, from), targetStep(size, to)],
    options,
  );
  const start = centerOf({...from, width: 400, height: 200});
  const end = centerOf({...to, width: 800, height: 400});
  for (const progress of [0, 0.25, 0.5, 0.75, 1]) {
    const center = centerOf(visibleWindowAt(timeline, progress));
    assert.ok(
      Math.abs(center.x - (start.x + (end.x - start.x) * progress)) <= 0.01 &&
        Math.abs(center.y - (start.y + (end.y - start.y) * progress)) <= 0.01,
      `${JSON.stringify(center)} at ${progress}`,
    );
  }
});

test('a rescaling window starts and ends on the placements of its holds', () => {
  const size = {width: 1080, height: 1080};
  const from = fitted(size, 64, [480, 117]);
  const to = fitted(size, 64, [2644, 139]);
  const timeline = planTimeline(
    [targetStep(size, from), targetStep(size, to)],
    options,
  );
  const [, early, late] = timeline.scenes;
  const placement = (scene: TimelineScene, timeMs: number) => {
    const {left, top, width, height, scale} = styleOf(
      timeline,
      scene,
      'window',
      timeMs,
    );
    return {left, top, width, height, scale};
  };
  const rounded = (window: WindowPlacement) =>
    Object.fromEntries(
      Object.entries(window).map(([key, value]) => [
        key,
        Number(value.toFixed(6)),
      ]),
    );
  assert.deepEqual(placement(early, 0), rounded(from));
  assert.deepEqual(placement(late, late.durationMs), rounded(to));
});

test('transitions belong to the destination and default independently', () => {
  const first = {
    ...step('a'),
    transition: {ms: 333, easing: 'strong' as const},
  };
  const second = {
    ...step('b'),
    transition: {ms: 701, easing: [0.25, 0.1, 0.25, 1] as const},
  };
  const timeline = planTimeline([first, second, step('c')], options);
  assert.deepEqual(
    order(timeline).filter(([kind]) => kind === 'transition'),
    [
      ['transition', 0, 351, 0],
      ['transition', 1, 350, 351],
      ['transition', 1, 451, 0],
      ['transition', 2, 450, 451],
    ],
  );
  assert.ok(
    timeline.scenes.some(
      scene =>
        scene.kind === 'transition' &&
        scene.code.includes('701ms cubic-bezier(0.25, 0.1, 0.25, 1)'),
    ),
  );
  assert.deepEqual(
    planTimeline([first, step('b')], options),
    planTimeline([step('a'), step('b')], options),
  );
});

test('explicit default transitions preserve the complete timeline bytes', () => {
  const steps = [step('a'), step('a\nb'), step('b')] as const;
  assert.equal(
    JSON.stringify(planTimeline(steps, options)),
    JSON.stringify(
      planTimeline(
        [
          steps[0],
          {
            ...steps[1],
            transition: {ms: options.transitionMs, easing: options.easing},
          },
          {
            ...steps[2],
            transition: {ms: options.transitionMs, easing: options.easing},
          },
        ],
        options,
      ),
    ),
  );
});
