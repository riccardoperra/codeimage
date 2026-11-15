import assert from 'node:assert/strict';
import {readFile, readdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import {PNG} from 'pngjs';

const [before, after] = process.argv.slice(2);
assert.ok(before && after, 'Usage: node compare-watermark.mjs BEFORE AFTER');
const read = async dir =>
  JSON.parse(await readFile(resolve(dir, 'watermark.json'), 'utf8'));
const baseline = await read(before);
const current = await read(after);
assert.deepEqual(
  current.map(sample => sample.name),
  baseline.map(sample => sample.name),
  'Both runs exercised the same scenarios',
);
for (const [index, sample] of current.entries()) {
  const previous = baseline[index];
  assert.equal(sample.frames.length, previous.frames.length, sample.name);
  for (const [frameIndex, frame] of sample.frames.entries()) {
    const old = previous.frames[frameIndex];
    const label = `${sample.name}, frame ${frameIndex}`;
    for (const key of [
      'slot',
      'codeOverlap',
      'signatureOverlap',
      'controlOverlap',
      'logos',
    ])
      assert.equal(frame[key], old[key], `${label}: ${key}`);
    assert.ok(Math.abs(frame.width - old.width) < 0.1, `${label}: logo width`);
  }
}
const images = (await readdir(before)).filter(
  name => name.startsWith('watermark-') && name.endsWith('.png'),
);
for (const name of images) {
  const old = PNG.sync.read(await readFile(resolve(before, name)));
  const image = PNG.sync.read(await readFile(resolve(after, name)));
  assert.deepEqual(
    [image.width, image.height],
    [old.width, old.height],
    `${name}: exported dimensions`,
  );
}
console.log(
  `PASS watermark equivalence: ${current.length} scenarios, ${images.length} image dimensions`,
);
