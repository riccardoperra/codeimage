import {expect, test} from 'vitest';
import {exportTabName} from './export-tab-name';

test('numbers four tabs and makes slashes and spaces safe', () => {
  expect(
    ['index.ts', 'src/ui card.tsx', 'dir\\file.ts', '  ../  '].map(
      (name, index) => exportTabName(name, index, 'png'),
    ),
  ).toEqual([
    '01-index.ts.png',
    '02-src-ui-card.tsx.png',
    '03-dir-file.ts.png',
    '04-untitled.png',
  ]);
});

test('supports SVG, JPEG, unnamed and duplicate tabs', () => {
  expect(exportTabName(null, 0, 'svg')).toBe('01-untitled.svg');
  expect(exportTabName('same', 1, 'jpeg')).toBe('02-same.jpeg');
  expect(exportTabName('same', 0, 'png')).not.toBe(
    exportTabName('same', 1, 'png'),
  );
});
