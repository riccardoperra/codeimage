import assert from 'node:assert/strict';
import {performance} from 'node:perf_hooks';
import {detectSecrets} from '../src/detect.js';

const input = Array.from({length: 2000}, (_, line) =>
  line % 100 === 0
    ? `const token${line} = "ghp_FakeOnly0123456789AbCdEfGhIjKlMnOpQr";`
    : `const row${line} = {id: ${line}, message: "ordinary code without credentials"};`,
).join('\n');
for (let warmup = 0; warmup < 5; warmup++) detectSecrets(input);
const times = Array.from({length: 30}, () => {
  const start = performance.now();
  const matches = detectSecrets(input);
  const elapsed = performance.now() - start;
  assert.equal(matches.length, 20);
  assert.ok(matches.every(match => match.ruleId === 'github-pat'));
  return elapsed;
}).sort((a, b) => a - b);
const median = (times[14] + times[15]) / 2;
console.log(
  JSON.stringify({
    lines: 2000,
    bytes: Buffer.byteLength(input),
    runs: times.length,
    matchesPerRun: 20,
    medianMs: median,
    minMs: times[0],
    maxMs: times[29],
  }),
);
assert.ok(median <= 20, `Detector median ${median}ms exceeds 20ms`);
