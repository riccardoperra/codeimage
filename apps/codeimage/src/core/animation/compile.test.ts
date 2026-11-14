import assert from 'node:assert/strict';
import {test} from 'vitest';
import {compileScene} from './compile';
import type {Scene, StepBox, TokenTransition} from './model';

const metrics = {charWidth: 10, lineHeight: 20};
const timing = {transitionMs: 1000, easing: 'linear'} as const;

const box = (overrides: Partial<StepBox> = {}): StepBox => ({
  rows: 3,
  columns: 8,
  indent: 0,
  gutterColumns: 0,
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

// The style of the element that shows `text`, and the keyframes it plays.
function animationOf(compiled: {html: string; css: string}, text: string) {
  const style = compiled.html.match(
    new RegExp(`style="([^"]*)">${text}</span>`),
  )?.[1];
  assert.ok(style, `rendered ${text}`);
  const name = style.match(/animation:(\S+) /)?.[1];
  const keyframes = name
    ? compiled.css.match(new RegExp(`@keyframes ${name}\\{.*\\}`))?.[0]
    : undefined;
  return {style, keyframes};
}

test('a move starts at its old cell and ends at its new one', () => {
  const compiled = compileScene(
    scene([
      {
        kind: 'move',
        key: 'k',
        text: 'x',
        classes: 'c',
        from: {line: 0, col: 0},
        to: {line: 2, col: 4},
      },
    ]),
    metrics,
    timing,
  );
  const {style, keyframes} = animationOf(compiled, 'x');
  assert.match(style, /left:40px;top:40px/);
  assert.match(style, /animation:\S+ 1000ms linear 0ms both/);
  // The old cell is 4 columns left of and 2 lines above the new one.
  assert.match(keyframes!, /from\{left:0px;top:0px\}to\{left:40px;top:40px\}/);
});

test('leaving tokens fade out by 30% and entering tokens fade in from 70%', () => {
  const compiled = compileScene(
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
    metrics,
    timing,
  );
  const leave = animationOf(compiled, 'old');
  assert.match(leave.style, /left:20px;top:20px/);
  assert.match(
    leave.keyframes!,
    /0%\{opacity:1\}30%\{opacity:0\}100%\{opacity:0\}/,
  );
  const enter = animationOf(compiled, 'new');
  assert.match(enter.style, /left:10px;top:0px/);
  assert.match(
    enter.keyframes!,
    /0%\{opacity:0\}70%\{opacity:0\}100%\{opacity:1\}/,
  );
});

test('a token that keeps its cell and opacity is not animated', () => {
  const compiled = compileScene(
    scene([
      {
        kind: 'move',
        key: 'k',
        text: 'same',
        classes: 'c',
        from: {line: 1, col: 1},
        to: {line: 1, col: 1},
      },
    ]),
    metrics,
    timing,
  );
  assert.doesNotMatch(animationOf(compiled, 'same').style, /animation/);
});

test('a token that changes classes slides in both colors while they crossfade', () => {
  const compiled = compileScene(
    scene([
      {
        kind: 'move',
        key: 'k',
        text: 'x',
        classes: 'new',
        fromClasses: 'old',
        from: {line: 0, col: 0},
        to: {line: 1, col: 2},
      },
    ]),
    metrics,
    timing,
  );
  const spans = Array.from(
    compiled.html.matchAll(
      /<span class="(\w+)" style="[^"]*animation:(\S+) [^"]*">x<\/span>/g,
    ),
    ([, classes, name]) => [
      classes,
      compiled.css.match(new RegExp(`@keyframes ${name}\\{(.*)\\}`))?.[1],
    ],
  );
  assert.deepEqual(spans, [
    ['old', 'from{left:0px;top:0px;opacity:1}to{left:20px;top:20px;opacity:0}'],
    ['new', 'from{left:0px;top:0px;opacity:0}to{left:20px;top:20px;opacity:1}'],
  ]);
});

test('code shifts by the diff indent and fades with focus dimming', () => {
  const compiled = compileScene(
    scene(
      [
        {
          kind: 'move',
          key: 'k',
          text: 'x',
          classes: '',
          from: {line: 0, col: 0},
          to: {line: 0, col: 0},
        },
      ],
      {from: box({indent: 2, dimmed: new Set([0])}), to: box()},
    ),
    metrics,
    timing,
  );
  const {style, keyframes} = animationOf(compiled, 'x');
  assert.match(style, /left:0px/);
  assert.match(
    keyframes!,
    /from\{left:20px;top:0px;opacity:0.35\}to\{left:0px;top:0px;opacity:1\}/,
  );
});

test('the code box animates between the two step sizes', () => {
  const compiled = compileScene(
    scene([], {
      from: box({rows: 2, columns: 5}),
      to: box({rows: 4, columns: 9}),
    }),
    metrics,
    timing,
    's1',
  );
  assert.ok(
    compiled.css.includes(
      '@keyframes s1-box{from{width:50px;height:40px}to{width:90px;height:80px}}',
    ),
  );
  assert.ok(compiled.html.includes('width:90px;height:80px;animation:s1-box'));
});

test('a scene that shows the second half starts every animation late', () => {
  const compiled = compileScene(
    scene([
      {
        kind: 'enter',
        key: 'b',
        text: 'new',
        classes: '',
        to: {line: 0, col: 0},
      },
    ]),
    metrics,
    {...timing, offsetMs: 400},
  );
  assert.match(animationOf(compiled, 'new').style, /1000ms linear -400ms both/);
});

test('escapes token text and renders line numbers only with a gutter', () => {
  const withoutGutter = compileScene(
    scene([
      {
        kind: 'enter',
        key: 'b',
        text: '<a&b>',
        classes: '',
        to: {line: 0, col: 0},
      },
    ]),
    metrics,
    timing,
  );
  assert.ok(withoutGutter.html.includes('>&lt;a&amp;b&gt;</span>'));
  assert.ok(!withoutGutter.html.includes('cm-gutters'));
  const withGutter = compileScene(
    scene([], {
      gutter: [
        {
          kind: 'enter',
          key: 'gutter:9',
          text: '9',
          classes: '',
          to: {line: 0, col: 1},
        },
      ],
      from: box({gutterColumns: 1}),
      to: box({gutterColumns: 2}),
    }),
    metrics,
    timing,
  );
  assert.ok(withGutter.html.includes('class="cm-gutters"'));
  assert.ok(
    withGutter.css.includes(
      'from{width:10px;height:60px}to{width:20px;height:60px}',
    ),
  );
  assert.match(animationOf(withGutter, '9').style, /left:10px;top:0px/);
});
