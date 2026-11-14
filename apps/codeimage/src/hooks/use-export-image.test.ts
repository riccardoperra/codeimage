/// <reference types="node" />
import assert from 'node:assert/strict';
import {test} from 'node:test';
import {exportTabName} from './export-tab-name';

test('numbers four tabs and makes slashes and spaces safe', () => {
  assert.deepEqual(
    ['index.ts', 'src/ui card.tsx', 'dir\\file.ts', '  ../  '].map(
      (name, index) => exportTabName(name, index, 'png'),
    ),
    [
      '01-index.ts.png',
      '02-src-ui-card.tsx.png',
      '03-dir-file.ts.png',
      '04-untitled.png',
    ],
  );
});

test('supports SVG, JPEG, unnamed and duplicate tabs', () => {
  assert.equal(exportTabName(null, 0, 'svg'), '01-untitled.svg');
  assert.equal(exportTabName('same', 1, 'jpeg'), '02-same.jpeg');
  assert.notEqual(
    exportTabName('same', 0, 'png'),
    exportTabName('same', 1, 'png'),
  );
});
