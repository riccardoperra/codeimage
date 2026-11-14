import assert from 'node:assert/strict';
import {test} from 'node:test';
import {getExportTarget} from '../src/lib/base/aspectRatio.ts';

for (const [id, width, height] of [
  ['x-landscape', 1600, 900],
  ['square', 1080, 1080],
  ['linkedin-portrait', 1080, 1350],
  ['open-graph', 1200, 630],
] as const) {
  test(`${id} exports at ${width} by ${height} pixels`, () => {
    assert.deepEqual(getExportTarget(id)?.resolution, [width, height]);
  });
}

test('free size and proportional ratios are not fixed export targets', () => {
  assert.equal(getExportTarget(null), undefined);
  assert.equal(getExportTarget('16 / 9'), undefined);
});
