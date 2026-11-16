import {expect, test} from 'vitest';
import {removeScriptStep} from './script';

test('removing a middle step keeps surviving ids, shifts focus and preserves valid visibility ranges', () => {
  expect(
    removeScriptStep(
      {
        steps: ['one', 'two', 'three', 'four'],
        lines: [
          {line: 1, enter: 2, leave: 3, focus: [2, 3, 4]},
          {line: 2, enter: 4},
        ],
      },
      2,
    ),
  ).toEqual({
    steps: ['one', 'three', 'four'],
    lines: [
      {line: 1, enter: 2, focus: [2, 3]},
      {line: 2, enter: 3},
    ],
  });
});
test('removing the penultimate script step returns to a single tab step', () => {
  expect(
    removeScriptStep({steps: ['one', 'two'], lines: []}, 1),
  ).toBeUndefined();
});
