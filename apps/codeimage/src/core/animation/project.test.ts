import {expect, test} from 'vitest';
import {projectStep} from './project';

const tab = {
  code: 'first\nremoved\nadded\nlast',
  marks: {
    lines: [
      {line: 2, kind: 'removed' as const},
      {line: 3, kind: 'added' as const},
      {line: 4, kind: 'highlight' as const},
    ],
    focusedLines: [4],
  },
};
test('whole tabs preserve code and marks with source row identities', () => {
  expect(projectStep(tab)).toEqual({...tab, rows: [1, 2, 3, 4]});
});
test('diff projection removes opposite sides and remaps highlights and focus', () => {
  expect(projectStep(tab, {kind: 'diff', side: 'before'})).toEqual({
    code: 'first\nremoved\nlast',
    rows: [1, 2, 4],
    marks: {lines: [{line: 3, kind: 'highlight'}], focusedLines: [3]},
  });
  expect(projectStep(tab, {kind: 'diff', side: 'after'}).code).toBe(
    'first\nadded\nlast',
  );
});
test('script projection uses step ranges and script focus, keeping highlight marks only', () => {
  const scripted = {
    ...tab,
    marks: {
      ...tab.marks,
      script: {
        steps: ['one', 'two', 'three'],
        lines: [
          {line: 2, leave: 2},
          {line: 3, enter: 2, focus: [3]},
        ],
      },
    },
  };
  expect(projectStep(scripted, {kind: 'script', step: 1}).code).toBe(
    'first\nremoved\nlast',
  );
  expect(
    projectStep(scripted, {kind: 'script', step: 2}).marks.focusedLines,
  ).toEqual([]);
  expect(projectStep(scripted, {kind: 'script', step: 3})).toEqual({
    code: 'first\nadded\nlast',
    rows: [1, 3, 4],
    marks: {lines: [{line: 3, kind: 'highlight'}], focusedLines: [2]},
  });
});
