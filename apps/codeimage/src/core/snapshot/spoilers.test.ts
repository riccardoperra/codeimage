import assert from 'node:assert/strict';
import {test} from 'vitest';
import {maskLine, maskLines, spoilersByLine} from './spoilers';

test('a spoiler hides only its part of the line and keeps its width', () => {
  const {line, runs} = maskLine(
    [
      {text: 'const ', classes: 'k'},
      {text: 'token', classes: ''},
      {text: ' = ', classes: ''},
      {text: '"sk-live-123"', classes: 's'},
      {text: ';', classes: ''},
    ],
    [[15, 26]],
  );
  assert.equal(
    line.map(span => span.text).join(''),
    `const token = "${' '.repeat(11)}";`,
  );
  assert.deepEqual(
    line.filter(span => span.classes.includes('cm-spoiler')),
    [{text: ' '.repeat(11), classes: 's cm-spoiler'}],
  );
  assert.deepEqual(runs, [{from: 15, to: 26, classes: 's'}]);
  assert.ok(!line.some(span => span.text.includes('sk-live')));
});

test('a spoiler across tokens hides each piece in its own color', () => {
  const {line, runs} = maskLine(
    [
      {text: 'ab', classes: 'x'},
      {text: 'cd', classes: 'y'},
    ],
    [[1, 3]],
  );
  assert.deepEqual(line, [
    {text: 'a', classes: 'x'},
    {text: ' ', classes: 'x cm-spoiler'},
    {text: ' ', classes: 'y cm-spoiler'},
    {text: 'd', classes: 'y'},
  ]);
  assert.deepEqual(
    runs.map(run => [run.from, run.to]),
    [
      [1, 2],
      [2, 3],
    ],
  );
});

test('overlapping spoilers merge and other lines stay untouched', () => {
  assert.deepEqual(
    [
      ...spoilersByLine([
        {line: 2, from: 4, to: 8},
        {line: 2, from: 1, to: 5},
        {line: 3, from: 2, to: 2},
      ]),
    ],
    [[2, [[1, 8]]]],
  );
  const {lines} = maskLines(
    [[{text: 'keep', classes: ''}], [{text: 'secret!!', classes: ''}]],
    [{line: 2, from: 0, to: 6}],
  );
  assert.deepEqual(
    lines.map(line => line.map(span => span.text).join('')),
    ['keep', '      !!'],
  );
});
