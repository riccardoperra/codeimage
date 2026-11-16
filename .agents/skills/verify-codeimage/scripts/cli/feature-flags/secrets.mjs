import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {fixture, cli, file, png} from './common.mjs';
export const tokens = [
  'ghp_aB3dE6gH9jK2mN5pQ8sT1vW4yZ7cF0iL3oP6',
  'AKIAFAKEONLYABCDEFGH',
  'postgresql://user:aB3dE6gH9jK2mN5p@example.invalid/db',
];
export const secretFile = await fixture(
  'secrets.ts',
  tokens.map((token, i) => `const credential${i} = "${token}";`).join('\n'),
);
export const redacted = await cli('p6-redacted', [
  secretFile,
  '--alt',
  '-o',
  file('p6-redacted.png'),
]);
assert.match(redacted.stderr, /redacted 3 secrets/);
export const diagnostics = stderr =>
  stderr.split('\n').filter(line => line && !line.startsWith('codeimage: '));
assert.equal(diagnostics(redacted.stderr).length, 4);
assert.match(redacted.stderr, /secrets.ts:1:22: github-pat/);
export const maskedAlt = await readFile(
  file('p6-redacted.png.alt.txt'),
  'utf8',
);
for (const token of tokens) assert.ok(!maskedAlt.includes(token));
assert.match(maskedAlt, /ghp_••/);
await cli('p6-svg', [
  secretFile,
  '--format',
  'svg',
  '-o',
  file('p6-redacted.svg'),
]);
export const maskedCode = maskedAlt.slice(maskedAlt.indexOf('\n\n') + 2);
export const maskedFile = await fixture('masked/secrets.ts', maskedCode);
await cli('p6-svg-masked', [
  maskedFile,
  '--no-redact',
  '--format',
  'svg',
  '-o',
  file('p6-masked.svg'),
]);
assert.ok(
  (await readFile(file('p6-redacted.svg'))).equals(
    await readFile(file('p6-masked.svg')),
  ),
  'the redacted SVG must equal the render of the masked code',
);
export const unredacted = await cli('p6-no-redact', [
  secretFile,
  '--no-redact',
  '--alt',
  '-o',
  file('p6-no-redact.png'),
]);
assert.deepEqual(diagnostics(unredacted.stderr), []);
export const originalAlt = await readFile(
  file('p6-no-redact.png.alt.txt'),
  'utf8',
);
for (const token of tokens) assert.ok(originalAlt.includes(token));
assert.notDeepEqual(
  (await png(file('p6-redacted.png'))).data,
  (await png(file('p6-no-redact.png'))).data,
);
