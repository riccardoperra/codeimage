import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {cli, file, dimensions, fixture} from './common.mjs';
import {a, b, c} from './focus.mjs';
await cli('p8-split', [
  a,
  b,
  c,
  '--split-tabs',
  '--size',
  'x-landscape',
  '--alt',
  '-o',
  file('p8-out.png'),
]);
for (let index = 1; index <= 3; index++)
  await dimensions(file(`p8-out-0${index}.png`), 1600, 900);
for (const [index, code] of [
  [1, 'line1'],
  [2, 'second tab'],
  [3, 'third tab'],
])
  assert.ok(
    (await readFile(file(`p8-out-0${index}.png.alt.txt`), 'utf8')).includes(
      code,
    ),
  );
await cli('p8-svg', [
  a,
  b,
  '--split-tabs',
  '--format',
  'svg',
  '-o',
  file('p8-out.svg'),
]);
for (let index = 1; index <= 2; index++)
  assert.match(await readFile(file(`p8-out-0${index}.svg`), 'utf8'), /<svg/);
await cli('p9-alt', [a, '--alt', '-o', file('p9-alt.png')]);
assert.match(
  await readFile(file('p9-alt.png.alt.txt'), 'utf8'),
  /^TypeScript code, a.ts, lines 1 to 12\n\n/,
);
await cli('p9-range', [
  a,
  '--lines',
  '5-12',
  '--alt',
  '-o',
  file('p9-range.png'),
]);
export const rangeAlt = await readFile(file('p9-range.png.alt.txt'), 'utf8');
assert.match(rangeAlt, /lines 5 to 12/);
assert.doesNotMatch(rangeAlt, /const line4 =/);
export const unicode = await fixture(
  'unicode.ts',
  'const value = "👨‍👩‍👧‍👦 中文 한국어";\n'.repeat(200),
);
await cli('p9-truncate', [unicode, '--alt', '-o', file('p9-truncate.png')]);
export const truncated = await readFile(
  file('p9-truncate.png.alt.txt'),
  'utf8',
);
assert.match(truncated, /\[Code truncated\]$/);
assert.ok([...new Intl.Segmenter().segment(truncated)].length <= 1000);
