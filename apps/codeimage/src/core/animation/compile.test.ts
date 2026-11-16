import assert from 'node:assert/strict';
import {test} from 'vitest';
import {compileScene} from './compile';
import type {
  Cell,
  MarkTransition,
  Scene,
  SceneTiming,
  StepBox,
  TokenTransition,
} from './model';
import {descendants, parseHtml, styleAt, type Element} from './test-utils';

const metrics = {charWidth: 10, lineHeight: 20};
const timing = {transitionMs: 1000, easing: 'linear'} as const;

const box = (overrides: Partial<StepBox> = {}): StepBox => ({
  rows: 3,
  columns: 8,
  dimmed: new Set(),
  ...overrides,
});

const scene = (
  code: TokenTransition[],
  overrides: Partial<Scene> = {},
): Scene => ({
  code,
  gutter: null,
  marks: [],
  from: box(),
  to: box(),
  ...overrides,
});

const move = (
  text: string,
  from: Cell,
  to: Cell,
): Extract<TokenTransition, {kind: 'move'}> => ({
  kind: 'move',
  key: text,
  text,
  classes: 'c',
  from,
  to,
});

function play(input: Scene, sceneTiming: SceneTiming = timing) {
  const {html, css} = compileScene(input, metrics, sceneTiming, 'a');
  const elements = descendants(parseHtml(html));
  const pose = (element: Element, timeMs: number) => {
    const {left, top, opacity = 1} = styleAt(element, css, timeMs);
    return {left, top, opacity};
  };
  const sized = (element: Element, timeMs: number) => {
    const {width, height} = styleAt(element, css, timeMs);
    return {width, height};
  };
  const all = (text: string) =>
    elements.filter(element => element.text === text);
  return {
    elements,
    at: (text: string, timeMs: number) => {
      const [element, ...others] = all(text);
      assert.ok(element && !others.length, `one element shows ${text}`);
      return pose(element, timeMs);
    },
    each: (text: string, timeMs: number) =>
      all(text).map(element => ({
        classes: element.attributes.class,
        ...pose(element, timeMs),
      })),
    boxOf: (text: string, timeMs: number) => {
      const [element] = all(text);
      return sized(element.parent!, timeMs);
    },
    marks: (timeMs: number) =>
      elements
        .filter(element => element.attributes['data-mark'])
        .map(element => ({
          mark: element.attributes['data-mark'],
          ...pose(element, timeMs),
        })),
    numberBands: (timeMs: number) =>
      elements.flatMap(element => {
        const [, mark] =
          element.attributes.class?.match(/\bcm-lineMark-(\w+)/) ?? [];
        return mark ? [{mark, ...pose(element, timeMs)}] : [];
      }),
  };
}

test('a move slides from its old cell to its new one', () => {
  const {at} = play(scene([move('x', {line: 0, col: 0}, {line: 2, col: 4})]));
  assert.deepEqual(at('x', 0), {left: 0, top: 0, opacity: 1});
  assert.deepEqual(at('x', 500), {left: 20, top: 20, opacity: 1});
  assert.deepEqual(at('x', 1000), {left: 40, top: 40, opacity: 1});
});

test('leaving tokens are gone at 30% and entering tokens start at 70%', () => {
  const {at} = play(
    scene([
      {
        kind: 'leave',
        key: 'a',
        text: 'old',
        classes: '',
        from: {line: 1, col: 2},
      },
      {
        kind: 'enter',
        key: 'b',
        text: 'new',
        classes: '',
        to: {line: 0, col: 1},
      },
    ]),
  );
  assert.deepEqual(
    [0, 150, 300, 1000].map(time => at('old', time)),
    [1, 0.5, 0, 0].map(opacity => ({left: 20, top: 20, opacity})),
  );
  assert.deepEqual(
    [0, 700, 850, 1000].map(time => at('new', time)),
    [0, 0, 0.5, 1].map(opacity => ({left: 10, top: 0, opacity})),
  );
});

test('a token that keeps its cell stays put', () => {
  const {at} = play(
    scene([move('same', {line: 1, col: 1}, {line: 1, col: 1})]),
  );
  for (const time of [0, 500, 1000]) {
    assert.deepEqual(at('same', time), {left: 10, top: 20, opacity: 1});
  }
});

test('a token that changes classes slides in both colors while they crossfade', () => {
  const {each} = play(
    scene([
      {
        ...move('x', {line: 0, col: 0}, {line: 1, col: 2}),
        classes: 'new',
        fromClasses: 'old',
      },
    ]),
  );
  assert.deepEqual(each('x', 0), [
    {classes: 'old', left: 0, top: 0, opacity: 1},
    {classes: 'new', left: 0, top: 0, opacity: 0},
  ]);
  assert.deepEqual(each('x', 500), [
    {classes: 'old', left: 10, top: 10, opacity: 0.5},
    {classes: 'new', left: 10, top: 10, opacity: 0.5},
  ]);
  assert.deepEqual(each('x', 1000), [
    {classes: 'old', left: 20, top: 20, opacity: 0},
    {classes: 'new', left: 20, top: 20, opacity: 1},
  ]);
});

test('code fades with focus dimming', () => {
  const {at} = play(
    scene([move('x', {line: 0, col: 0}, {line: 0, col: 0})], {
      from: box({dimmed: new Set([0])}),
    }),
  );
  assert.deepEqual(at('x', 0), {left: 0, top: 0, opacity: 0.35});
  assert.deepEqual(at('x', 1000), {left: 0, top: 0, opacity: 1});
});

test('a row that loses focus dims while the row that gains it brightens', () => {
  const stay = (text: string, line: number) =>
    move(text, {line, col: 0}, {line, col: 0});
  const {at, marks} = play(
    scene([stay('x', 0), stay('y', 1)], {
      marks: [{...stay('', 0), mark: 'highlight'}],
      gutter: {
        numbers: [stay('1', 0), stay('2', 1)],
        fromColumns: 1,
        toColumns: 1,
      },
      from: box({dimmed: new Set([1])}),
      to: box({dimmed: new Set([0])}),
    }),
  );
  const opacity = (pose: (timeMs: number) => {opacity: number}) =>
    [0, 500, 1000].map(timeMs => pose(timeMs).opacity);
  for (const text of ['x', '1']) {
    assert.deepEqual(
      opacity(timeMs => at(text, timeMs)),
      [1, 0.675, 0.35],
    );
  }
  for (const text of ['y', '2']) {
    assert.deepEqual(
      opacity(timeMs => at(text, timeMs)),
      [0.35, 0.675, 1],
    );
  }
  assert.deepEqual(
    opacity(timeMs => marks(timeMs)[0]),
    [1, 0.675, 0.35],
  );
});

test('the code box grows from the first step size to the second', () => {
  const {boxOf} = play(
    scene([move('x', {line: 0, col: 0}, {line: 0, col: 0})], {
      from: box({rows: 2, columns: 5}),
      to: box({rows: 4, columns: 9}),
    }),
  );
  assert.deepEqual(boxOf('x', 0), {width: 50, height: 40});
  assert.deepEqual(boxOf('x', 500), {width: 70, height: 60});
  assert.deepEqual(boxOf('x', 1000), {width: 90, height: 80});
});

test('a scene that shows the second half starts where the first half is at that time', () => {
  const moving = scene([move('x', {line: 0, col: 0}, {line: 0, col: 10})]);
  const first = play(moving);
  const second = play(moving, {...timing, offsetMs: 400});
  assert.deepEqual(second.at('x', 0), first.at('x', 400));
  assert.deepEqual(second.at('x', 600), first.at('x', 1000));
});

test('a kept mark moves with its line, and the others fade', () => {
  const marks: MarkTransition[] = [
    {
      kind: 'move',
      key: 'k',
      mark: 'added',
      from: {line: 1, col: 0},
      to: {line: 2, col: 0},
    },
    {kind: 'leave', key: 'l', mark: 'highlight', from: {line: 0, col: 0}},
  ];
  const {marks: at} = play(scene([], {marks}));
  assert.deepEqual(at(0), [
    {mark: 'added', left: 0, top: 20, opacity: 1},
    {mark: 'highlight', left: 0, top: 0, opacity: 1},
  ]);
  assert.deepEqual(at(1000), [
    {mark: 'added', left: 0, top: 40, opacity: 1},
    {mark: 'highlight', left: 0, top: 0, opacity: 0},
  ]);
});

test('with a gutter, each mark also bands its line number', () => {
  const marks: MarkTransition[] = [
    {
      kind: 'move',
      key: 'k',
      mark: 'added',
      from: {line: 1, col: 0},
      to: {line: 2, col: 0},
    },
  ];
  const without = play(scene([], {marks}));
  assert.deepEqual(without.numberBands(0), []);
  const {marks: lines, numberBands} = play(
    scene([], {
      marks,
      gutter: {numbers: [], fromColumns: 1, toColumns: 1},
      from: box({dimmed: new Set([1])}),
    }),
  );
  for (const timeMs of [0, 500, 1000]) {
    assert.deepEqual(numberBands(timeMs), lines(timeMs));
  }
  assert.deepEqual(numberBands(0), [
    {mark: 'added', left: 0, top: 20, opacity: 0.35},
  ]);
});

test('token text is shown as text, not markup', () => {
  const {at} = play(
    scene([
      {
        kind: 'enter',
        key: 'b',
        text: '<a&b>',
        classes: '',
        to: {line: 0, col: 0},
      },
    ]),
  );
  assert.equal(at('<a&b>', 1000).opacity, 1);
});

test('line numbers appear only with a gutter, which grows with its digits', () => {
  const nine: TokenTransition = {
    kind: 'enter',
    key: 'gutter:9',
    text: '9',
    classes: '',
    to: {line: 0, col: 1},
  };
  const without = play(scene([]));
  assert.ok(without.elements.every(element => element.text !== '9'));
  const {at, boxOf} = play(
    scene([], {gutter: {numbers: [nine], fromColumns: 1, toColumns: 2}}),
  );
  assert.deepEqual(at('9', 1000), {left: 10, top: 0, opacity: 1});
  assert.deepEqual(boxOf('9', 0), {width: 10, height: 60});
  assert.deepEqual(boxOf('9', 1000), {width: 20, height: 60});
});

test('same-source entering and leaving rows overlap with no empty middle', () => {
  const input = scene(
    [
      {
        kind: 'leave',
        key: 'old',
        text: 'old',
        classes: '',
        from: {line: 0, col: 0},
      },
      {
        kind: 'enter',
        key: 'new',
        text: 'new',
        classes: '',
        to: {line: 0, col: 0},
      },
    ],
    {leaveEnd: 0.5, enterStart: 0.4},
  );
  const output = play(input);
  for (let time = 0; time <= 1000; time += 10) {
    const before = output.at('old', time).opacity;
    const after = output.at('new', time).opacity;
    assert.ok(before > 0 || after > 0, `empty at ${time}`);
    assert.ok(before < 1 || after < 1);
  }
  assert.deepEqual(
    compileScene(input, metrics, timing, 'ranges').activeRanges,
    [
      [0, 500],
      [400, 1000],
    ],
  );
});
