import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {createHash} from 'node:crypto';
import {mkdtemp, mkdir, readFile, readdir, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join, resolve} from 'node:path';

const directory = await mkdtemp(join(tmpdir(), 'codeimage-font-lanes-'));
const catalog = JSON.parse(
  await readFile('packages/render/dist/fonts/manifest.json', 'utf8'),
);
const binary = resolve('packages/cli/publish/dist/bin.js');
const code = 'const answer = 42;';
const cache = join(directory, 'cache');
async function cli(args, cacheDir = cache, command = binary) {
  return new Promise((done, reject) => {
    const child = spawn(process.execPath, [command, ...args], {
      env: {...process.env, CODEIMAGE_CACHE_DIR: cacheDir},
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    const stdout = [];
    const stderr = [];
    child.stdout.on('data', bytes => stdout.push(bytes));
    child.stderr.on('data', bytes => stderr.push(bytes));
    child.on('error', reject);
    child.on('close', status => {
      const error = Buffer.concat(stderr).toString();
      if (status !== 0) reject(new Error(error));
      else done({stdout: Buffer.concat(stdout), stderr: error});
    });
    child.stdin.end(code);
  });
}
const images = new Map();
for (const font of catalog.fonts.filter(font => font.role === 'code')) {
  const result = await cli(['--font', font.id]);
  images.set(font.id, result.stdout);
  await writeFile(join(directory, `${font.id}.png`), result.stdout);
}
assert.equal((await readdir(join(cache, 'fonts/sha256'))).length, 13);
console.error(
  'PASS fresh cache: 14 code fonts, 13 remote metric/subset files, no fallback downloads',
);
const fira = catalog.fonts
  .find(font => font.id === 'fira-code')
  .files.find(file => /-latin-wght/.test(file.file));
await writeFile(
  join(cache, 'fonts/sha256', fira.sha256),
  Buffer.alloc(fira.bytes),
);
const repaired = await cli(['--font=fira-code']);
assert.deepEqual(repaired.stdout, images.get('fira-code'));
assert.match(repaired.stderr, /repairing/);
console.error('PASS same-length corrupt Fira repaired; PNG unchanged');
const parallelCache = join(directory, 'parallel');
const races = await Promise.all(
  Array.from({length: 4}, () => cli(['--font=fira-code'], parallelCache)),
);
for (const result of races) assert.deepEqual(result.stdout, races[0].stdout);
assert.equal((await readdir(join(parallelCache, 'fonts/sha256'))).length, 1);
assert.equal(
  createHash('sha256')
    .update(await readFile(join(parallelCache, 'fonts/sha256', fira.sha256)))
    .digest('hex'),
  fira.sha256,
);
console.error(
  'PASS four cold CLI processes: identical PNGs, one verified cache object',
);
if (process.argv[2]) {
  const reused = await cli(
    ['--font=fira-code', '--offline'],
    cache,
    resolve(process.argv[2]),
  );
  assert.deepEqual(reused.stdout, images.get('fira-code'));
  console.error(
    'PASS separate installed tarball reuses the same cache offline',
  );
}
if (process.platform === 'darwin') {
  const localCache = join(directory, 'local');
  await mkdir(localCache);
  const result = await cli(
    ['--font-file=/System/Library/Fonts/SFNSMono.ttf', '--offline'],
    localCache,
  );
  assert.ok(
    result.stdout
      .subarray(0, 8)
      .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])),
  );
  assert.deepEqual(await readdir(localCache), []);
  await writeFile(join(directory, 'system-font.png'), result.stdout);
  console.error('PASS installed SFNSMono font; no cache access or mutation');
}
console.error(`Artifacts: ${directory}`);
