import assert from 'node:assert/strict';
import {altText} from './altText';

const tab = {
  code: Array(2000).fill('const greeting = "Hello world";').join('\n'),
  tab: {tabName: 'user.ts'},
  languageId: 'typescript',
  lineNumberStart: 1,
};
const samples: number[] = [];
for (let i = 0; i < 35; i++) {
  const start = performance.now();
  const result = altText(tab);
  const elapsed = performance.now() - start;
  assert.equal(result.length, 1000, 'cut to 1,000 characters');
  assert.ok(result.endsWith('[Code truncated]'), 'ends with the cut note');
  if (i >= 5) samples.push(elapsed);
}
samples.sort((a, b) => a - b);
const median = (samples[14] + samples[15]) / 2;
console.log(
  JSON.stringify({median, min: samples[0], max: samples[29], runs: 30, unit: 'ms'}),
);
assert.ok(median <= 2, 'median at most 2 ms');
