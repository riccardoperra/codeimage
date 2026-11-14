import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {mkdir, readFile, writeFile} from 'node:fs/promises';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {PNG} from 'pngjs';

const root = fileURLToPath(new URL('../../../', import.meta.url));
const directory = process.argv[2] ?? '/tmp/swarm-cli-flags';
await mkdir(directory, {recursive: true});
const file = name => join(directory, name);
const fixture = async (name, code) => {
  await mkdir(dirname(file(name)), {recursive: true});
  await writeFile(file(name), code);
  return file(name);
};
const receipts = [];
async function cli(lane, args, input) {
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
const png = async path => PNG.sync.read(await readFile(path));
const dimensions = async (path, width, height) => {
  const image = await png(path);
  assert.deepEqual([image.width, image.height], [width, height], path);
};
const a = await fixture(
  'a.ts',
  Array.from(
    {length: 12},
    (_, index) => `const line${index + 1} = ${index + 1};`,
  ).join('\n'),
);
const b = await fixture('b.py', 'print("second tab")');
const c = await fixture(
  'nested path/c.rs',
  'fn main() { println!("third tab"); }',
);
const patch =
  'diff --git a/a.ts b/a.ts\n--- a/a.ts\n+++ b/a.ts\n@@ -1 +1 @@\n-const before = 1;\n+const after = 2;\ndiff --git a/b.py b/b.py\n--- a/b.py\n+++ b/b.py\n@@ -1 +1 @@\n-print(1)\n+print(2)\n';
const patchFile = await fixture('changes.diff', patch);
await cli(
  'p5-diff-stdin',
  ['--diff', '--split-tabs', '--alt', '-o', file('p5-diff.png')],
  patch,
);
await cli('p5-diff-file', [
  patchFile,
  '--diff',
  '-o',
  file('p5-diff-file.png'),
]);
assert.match(
  await readFile(file('p5-diff-01.png.alt.txt'), 'utf8'),
  /TypeScript code, a.ts/,
);
assert.match(
  await readFile(file('p5-diff-02.png.alt.txt'), 'utf8'),
  /Python code, b.py/,
);
await cli('p5-plain', [a, '-o', file('p5-plain.png')]);
await cli('p5-focus', [
  a,
  '--highlight',
  '2-3',
  '--focus',
  '-o',
  file('p5-focus.png'),
]);
const plain = await png(file('p5-plain.png'));
const focused = await png(file('p5-focus.png'));
assert.deepEqual([plain.width, plain.height], [focused.width, focused.height]);
assert.notDeepEqual(
  plain.data,
  focused.data,
  'marks and focus must change rendered pixels',
);
const annotated = await fixture(
  'annotations.ts',
  'const added = 1; // [!code ++]\nconst removed = 2; // [!code --]\n// [!code focus:2]\nconst bright = 3;\nconst next = 4;\nconst dim = 5;',
);
await cli('p5-annotations', [
  annotated,
  '--alt',
  '-o',
  file('p5-annotations.png'),
]);
assert.doesNotMatch(
  await readFile(file('p5-annotations.png.alt.txt'), 'utf8'),
  /\[!code/,
);
const tokens = [
  'ghp_aB3dE6gH9jK2mN5pQ8sT1vW4yZ7cF0iL3oP6',
  'AKIAFAKEONLYABCDEFGH',
  'postgresql://user:aB3dE6gH9jK2mN5p@example.invalid/db',
];
const secretFile = await fixture(
  'secrets.ts',
  tokens.map((token, i) => `const credential${i} = "${token}";`).join('\n'),
);
const redacted = await cli('p6-redacted', [
  secretFile,
  '--alt',
  '-o',
  file('p6-redacted.png'),
]);
assert.match(redacted.stderr, /redacted 3 secrets/);
assert.equal(redacted.stderr.trim().split('\n').length, 4);
assert.match(redacted.stderr, /secrets.ts:1:22: github-pat/);
const maskedAlt = await readFile(file('p6-redacted.png.alt.txt'), 'utf8');
for (const token of tokens) assert.ok(!maskedAlt.includes(token));
assert.match(maskedAlt, /ghp_••/);
await cli('p6-svg', [
  secretFile,
  '--format',
  'svg',
  '-o',
  file('p6-redacted.svg'),
]);
const svg = await readFile(file('p6-redacted.svg'), 'utf8');
assert.match(svg, /<svg/);
for (const token of tokens) assert.ok(!svg.includes(token));
const unredacted = await cli('p6-no-redact', [
  secretFile,
  '--no-redact',
  '--alt',
  '-o',
  file('p6-no-redact.png'),
]);
assert.equal(unredacted.stderr, '');
const originalAlt = await readFile(file('p6-no-redact.png.alt.txt'), 'utf8');
for (const token of tokens) assert.ok(originalAlt.includes(token));
assert.notDeepEqual(
  (await png(file('p6-redacted.png'))).data,
  (await png(file('p6-no-redact.png'))).data,
);
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
    '--scale',
    '2',
    '-o',
    file(`p7-${target}.png`),
  ]);
  await dimensions(file(`p7-${target}.png`), width, height);
}
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
const long = await fixture(
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
const jpeg = await readFile(file('p7-og.jpeg'));
assert.equal(jpeg.readUInt16BE(0), 0xffd8);
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
const rangeAlt = await readFile(file('p9-range.png.alt.txt'), 'utf8');
assert.match(rangeAlt, /lines 5 to 12/);
assert.doesNotMatch(rangeAlt, /const line4 =/);
const unicode = await fixture(
  'unicode.ts',
  'const value = "👨‍👩‍👧‍👦 中文 한국어";\n'.repeat(200),
);
await cli('p9-truncate', [unicode, '--alt', '-o', file('p9-truncate.png')]);
const truncated = await readFile(file('p9-truncate.png.alt.txt'), 'utf8');
assert.match(truncated, /\[Code truncated\]$/);
assert.ok([...new Intl.Segmenter().segment(truncated)].length <= 1000);
await writeFile(
  file('feature-flags-results.json'),
  JSON.stringify({passed: true, receipts}, null, 2) + '\n',
);
console.log(
  `Verified ${receipts.length} CLI runs and their artifacts in ${directory}`,
);
