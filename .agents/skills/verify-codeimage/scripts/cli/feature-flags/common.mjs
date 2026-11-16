import {fileURLToPath} from 'node:url';
import {mkdir, readFile, writeFile} from 'node:fs/promises';
import {dirname, join} from 'node:path';
import {spawnSync} from 'node:child_process';
import assert from 'node:assert/strict';
import {PNG} from 'pngjs';
export const root = fileURLToPath(
  new URL('../../../../../../', import.meta.url),
);
export const directory = process.argv[2] ?? '/tmp/swarm-cli-flags';
await mkdir(directory, {recursive: true});
export const file = name => join(directory, name);
export const fixture = async (name, code) => {
  await mkdir(dirname(file(name)), {recursive: true});
  await writeFile(file(name), code);
  return file(name);
};
export const receipts = [];
export async function cli(lane, args, input) {
  const run = spawnSync(
    process.execPath,
    ['packages/cli/dist/bin.js', ...args],
    {cwd: root, input, encoding: 'utf8', maxBuffer: 20 * 1024 * 1024},
  );
  await writeFile(file(`${lane}.stdout.txt`), run.stdout ?? '');
  await writeFile(file(`${lane}.stderr.txt`), run.stderr ?? '');
  assert.equal(run.status, 0, `${lane}: ${run.error ?? run.stderr}`);
  receipts.push({lane, args, exit: run.status});
  console.log(`PASS ${lane}`);
  return run;
}
export async function usageError(lane, args, message) {
  const run = spawnSync(
    process.execPath,
    ['packages/cli/dist/bin.js', ...args],
    {
      cwd: root,
      encoding: 'utf8',
    },
  );
  await writeFile(file(`${lane}.stderr.txt`), run.stderr ?? '');
  assert.equal(run.status, 2, `${lane}: ${run.stderr}`);
  assert.match(run.stderr, message, lane);
  receipts.push({lane, args, exit: run.status});
  console.log(`PASS ${lane}`);
}
export const png = async path => PNG.sync.read(await readFile(path));
export const dimensions = async (path, width, height) => {
  const image = await png(path);
  assert.deepEqual([image.width, image.height], [width, height], path);
};
