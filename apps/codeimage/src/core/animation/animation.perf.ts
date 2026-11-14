import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {draculaTheme} from '@codeimage/highlight/dracula';
import {tokenize} from '@core/snapshot/tokenize';
import {compileScene} from './compile';
import {pairScene} from './pair';

// The 35-line pair of the prototypes: every fifth line gains a comment line
// and turns `const` into `let`.
const source = readFileSync(
  new URL('../../hooks/use-export-image.ts', import.meta.url),
  'utf8',
)
  .split('\n')
  .slice(40, 75);
const from = source.join('\n');
const to = source
  .map((line, index) =>
    index % 5 === 0 ? `  // step two\n${line.replace('const', 'let')}` : line,
  )
  .join('\n');

const step = async (code: string) => ({
  lines: await tokenize(code, 'typescript', draculaTheme),
  marks: {lines: [], focusedLines: []},
  lineNumberStart: 1,
});

async function main() {
  const [a, b] = await Promise.all([step(from), step(to)]);
  const metrics = {charWidth: 9.6, lineHeight: 22.4};
  const timing = {transitionMs: 900, easing: 'smooth'} as const;
  const samples: number[] = [];
  let scene = pairScene(a, b, true);
  let css = 0;
  for (let i = 0; i < 35; i++) {
    const start = performance.now();
    scene = pairScene(a, b, true);
    css = compileScene(scene, metrics, timing).css.length;
    if (i >= 5) samples.push(performance.now() - start);
  }
  assert.ok(css > 0, 'compiled keyframes');
  const tokens = (step: 'from' | 'to') =>
    scene.code.filter(token =>
      step === 'from' ? token.kind !== 'enter' : token.kind !== 'leave',
    ).length;
  assert.ok(tokens('from') >= 150 && tokens('to') >= 150, 'about 200 tokens');
  samples.sort((x, y) => x - y);
  const median = (samples[14] + samples[15]) / 2;
  console.log(
    JSON.stringify({
      median,
      min: samples[0],
      max: samples[29],
      runs: 30,
      unit: 'ms',
      tokens: [tokens('from'), tokens('to')],
      cssBytes: css,
    }),
  );
  assert.ok(median <= 20, 'median at most 20 ms');
}

main();
