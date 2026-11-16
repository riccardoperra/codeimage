import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {cli, file, dimensions, usageError, png, fixture} from './common.mjs';
import {a} from './focus.mjs';
for (const [target, width, height] of [
  ['x-landscape', 1600, 900],
  ['square', 1080, 1080],
  ['linkedin-portrait', 1080, 1350],
  ['og', 1200, 630],
]) {
  await cli(`p7-${target}`, [
    a,
    '--size',
    target,
    '--signature',
    '@me',
    '-o',
    file(`p7-${target}.png`),
  ]);
  await dimensions(file(`p7-${target}.png`), width, height);
}
await usageError(
  'p7-scale-conflict',
  [a, '--size', 'og', '--scale', '2', '-o', file('unused.png')],
  /^codeimage: --scale: --size exports at the exact target size/,
);
await usageError(
  'p5-focus-missing-range',
  [a, '--focus'],
  /codeimage:.*--focus/,
);
await cli('p7-left', [
  a,
  '--size',
  'x-landscape',
  '--signature',
  '@me',
  '--signature-position',
  'bottom-left',
  '-o',
  file('p7-left.png'),
]);
assert.notDeepEqual(
  (await png(file('p7-left.png'))).data,
  (await png(file('p7-x-landscape.png'))).data,
);
export const long = await fixture(
  'long.ts',
  Array.from(
    {length: 60},
    (_, index) => `const line${index + 1} = ${index + 1};`,
  ).join('\n'),
);
await cli('p7-overflow', [
  long,
  '--size',
  'x-landscape',
  '--signature',
  `@${'h'.repeat(39)}`,
  '-o',
  file('p7-overflow.png'),
]);
await dimensions(file('p7-overflow.png'), 1600, 900);
await cli('p7-og-jpeg', [a, '--size', 'og', '-o', file('p7-og.jpeg')]);
export const jpeg = await readFile(file('p7-og.jpeg'));
assert.equal(jpeg.readUInt16BE(0), 0xffd8);
