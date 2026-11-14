import assert from 'node:assert/strict';
import {draculaTheme} from '@codeimage/highlight/dracula';
import {tokenize} from '@core/snapshot/tokenize';
import {test} from 'vitest';
import type {Step, TokenTransition} from './model';
import {pairScene, pairSteps} from './pair';

const SOURCE = `function add(a: number, b: number) {
  return a + b;
}

const total = add(1, 2);`;

const lines = (code: string) => tokenize(code, 'typescript', draculaTheme);

const step = async (
  code: string,
  overrides: Partial<Omit<Step, 'lines'>> = {},
): Promise<Step> => ({
  lines: await lines(code),
  marks: {lines: [], focusedLines: []},
  lineNumberStart: 1,
  ...overrides,
});

const byKind = (transitions: TokenTransition[], kind: string) =>
  transitions.filter(transition => transition.kind === kind);

// Every visible character, line by line, from tokens sorted by cell.
const visibleText = (transitions: TokenTransition[]) =>
  transitions
    .flatMap(transition =>
      transition.kind === 'leave'
        ? []
        : [{...transition.to, text: transition.text}],
    )
    .sort((a, b) => a.line - b.line || a.col - b.col)
    .reduce<string[]>((rows, {line, text}) => {
      rows[line] = (rows[line] ?? '') + text;
      return rows;
    }, [])
    .join('\n');

test('renaming one identifier leaves the old name, enters the new one, and moves the rest', async () => {
  const transitions = pairSteps(
    await lines(SOURCE),
    await lines(SOURCE.replace('total', 'result')),
  );
  assert.deepEqual(
    byKind(transitions, 'leave').map(transition => transition.text),
    ['total'],
  );
  assert.deepEqual(
    byKind(transitions, 'enter').map(transition => transition.text),
    ['result'],
  );
  const moves = byKind(transitions, 'move');
  assert.equal(moves.length, transitions.length - 2);
  assert.ok(moves.some(move => move.text === 'add'));
});

test('inserting two lines at the top moves every old token down two lines', async () => {
  const transitions = pairSteps(
    await lines(SOURCE),
    await lines(`import {x} from 'x';\n// two\n${SOURCE}`),
  );
  assert.equal(byKind(transitions, 'leave').length, 0);
  for (const transition of byKind(transitions, 'move')) {
    assert.ok(transition.kind === 'move');
    assert.deepEqual(transition.to, {
      line: transition.from.line + 2,
      col: transition.from.col,
    });
  }
  const entered = byKind(transitions, 'enter');
  assert.ok(
    entered.every(token => token.kind === 'enter' && token.to.line < 2),
  );
  assert.equal(
    new Set(transitions.map(token => token.key)).size,
    transitions.length,
  );
});

test('two identical steps only move tokens, each onto its own cell', async () => {
  const transitions = pairSteps(await lines(SOURCE), await lines(SOURCE));
  assert.equal(visibleText(transitions), SOURCE.replace(/[ \t]/g, ''));
  for (const transition of transitions) {
    assert.ok(transition.kind === 'move');
    assert.deepEqual(transition.from, transition.to);
    assert.equal(transition.fromClasses, undefined);
  }
});

test('a kept token that changes classes moves and names the classes it had', () => {
  const transitions = pairSteps(
    [[{text: 'foo', classes: 'a'}]],
    [
      [
        {text: '  ', classes: ''},
        {text: 'foo', classes: 'b'},
      ],
    ],
  );
  assert.deepEqual(
    transitions.map(({key: _, ...transition}) => transition),
    [
      {
        kind: 'move',
        text: 'foo',
        classes: 'b',
        fromClasses: 'a',
        from: {line: 0, col: 0},
        to: {line: 0, col: 2},
      },
    ],
  );
});

test('places tokens after a tab at the next tab stop', () => {
  const [token] = pairSteps(
    [[{text: 'ab\tx', classes: ''}]],
    [[{text: 'ab\tx', classes: ''}]],
  ).filter(transition => transition.text === 'x');
  assert.ok(token.kind === 'move');
  assert.deepEqual(token.to, {line: 0, col: 4});
});

test('places tokens after wide glyphs by their measured width', () => {
  const line = [[{text: '你好 x', classes: ''}]];
  const cellOfX = (widths?: Map<string, number>) => {
    const token = pairSteps(line, line, widths).find(({text}) => text === 'x');
    assert.ok(token?.kind === 'move');
    return token.to;
  };
  assert.deepEqual(cellOfX(), {line: 0, col: 3});
  assert.deepEqual(
    cellOfX(
      new Map([
        ['你', 1.5],
        ['好', 1.5],
      ]),
    ),
    {line: 0, col: 4},
  );
});

test('line numbers keep their place when lines are inserted at the top', async () => {
  const scene = pairScene(
    await step(SOURCE),
    await step(`// one\n// two\n${SOURCE}`),
    true,
  );
  const gutter = scene.gutter!;
  assert.deepEqual(
    byKind(gutter, 'enter').map(number => number.text),
    ['6', '7'],
  );
  for (const number of byKind(gutter, 'move')) {
    assert.ok(number.kind === 'move');
    assert.deepEqual(number.from, number.to);
  }
  assert.equal(new Set(gutter.map(number => number.text)).size, gutter.length);
});

test('line numbers slide right when the gutter gains a digit', async () => {
  const nine = Array.from({length: 9}, (_, index) => `x${index};`).join('\n');
  const scene = pairScene(
    await step(nine),
    await step(`${nine}\nmore;\nmore;`),
    true,
  );
  assert.equal(scene.from.gutterColumns, 1);
  assert.equal(scene.to.gutterColumns, 2);
  const one = scene.gutter!.find(number => number.text === '1')!;
  assert.ok(one.kind === 'move');
  assert.deepEqual(
    [one.from, one.to],
    [
      {line: 0, col: 0},
      {line: 0, col: 1},
    ],
  );
});

test('a mark both steps keep moves with its line, and the others fade', async () => {
  const scene = pairScene(
    await step(SOURCE, {
      marks: {
        lines: [
          {line: 2, kind: 'added'},
          {line: 5, kind: 'highlight'},
        ],
        focusedLines: [],
      },
    }),
    await step(`// note\n${SOURCE}`, {
      marks: {lines: [{line: 3, kind: 'added'}], focusedLines: []},
    }),
    false,
  );
  assert.equal(scene.gutter, null);
  assert.deepEqual(markRows(scene), [
    ['move', 'added', 1, 2],
    ['leave', 'highlight', 4, null],
  ]);
});

const markRows = (scene: {marks: TokenTransition[]}) =>
  scene.marks.map(mark => [
    mark.kind,
    mark.classes,
    mark.kind === 'enter' ? null : mark.from.line,
    mark.kind === 'leave' ? null : mark.to.line,
  ]);

test('marks on equal lines pair in order', async () => {
  const marks = (...lines: number[]) => ({
    lines: lines.map(line => ({line, kind: 'added' as const})),
    focusedLines: [],
  });
  const scene = pairScene(
    await step('x;\ny;\nx;', {marks: marks(1, 3)}),
    await step('// note\nx;\ny;\nx;', {marks: marks(2, 4)}),
    false,
  );
  assert.deepEqual(markRows(scene), [
    ['move', 'added', 0, 1],
    ['move', 'added', 2, 3],
  ]);
});

test('a mark keeps its place when its line changes under it', async () => {
  const marks = {
    lines: [{line: 2, kind: 'highlight' as const}],
    focusedLines: [2],
  };
  const scene = pairScene(
    await step('a;\nreturn a + b;', {marks}),
    await step('a;\nreturn sum(a, b);', {marks}),
    false,
  );
  assert.deepEqual(markRows(scene), [['move', 'highlight', 1, 1]]);
});

test('diff marks indent the code by two columns and focus dims the other rows', async () => {
  const scene = pairScene(
    await step('a\nbb\nccc', {
      marks: {
        lines: [
          {line: 1, kind: 'removed'},
          {line: 3, kind: 'highlight'},
        ],
        focusedLines: [3],
      },
    }),
    await step('a\nbb\nccc'),
    true,
  );
  assert.deepEqual(
    {...scene.from, dimmed: [...scene.from.dimmed]},
    {rows: 3, columns: 5, indent: 2, gutterColumns: 1, dimmed: [0, 1]},
  );
  assert.deepEqual(
    {...scene.to, dimmed: [...scene.to.dimmed]},
    {rows: 3, columns: 3, indent: 0, gutterColumns: 1, dimmed: []},
  );
});
