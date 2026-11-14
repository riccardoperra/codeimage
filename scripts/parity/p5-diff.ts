import assert from 'node:assert/strict';
import {mkdir, writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {diffPng} from './lib';

const out = process.env.P5_OUT ?? '/tmp/p5-stack';
const base = process.argv[2] ?? join(out, 'before');
const head = process.argv[3] ?? join(out, 'after');
const cases = [
  'no-marks',
  'fleet-dark',
  'vscode-dark',
  'xcode-dark',
  'night-owl',
  'material-light',
];

async function main() {
  await mkdir(join(out, 'diff'), {recursive: true});
  const rows = [];
  for (const name of cases) {
    const diffPercent = await diffPng(
      join(base, `${name}.png`),
      join(head, `${name}.png`),
      join(out, 'diff', `${name}.png`),
    );
    rows.push({name, diffPercent});
    console.log(`${name}\t${diffPercent.toFixed(4)}%`);
  }
  await writeFile(join(out, 'parity.json'), JSON.stringify(rows, null, 2));
  assert.ok(
    rows.every(row => row.diffPercent <= 0.1),
    'export parity exceeds 0.1%',
  );
}
main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
