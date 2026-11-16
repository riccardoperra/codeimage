import {PNG} from 'pngjs';
import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
export async function inkBounds(image: string, withoutWatermark: string) {
  const on = PNG.sync.read(await readFile(image));
  const off = PNG.sync.read(await readFile(withoutWatermark));
  assert.equal(on.width, off.width, 'watermark must not change image width');
  assert.equal(on.height, off.height, 'watermark must not change image height');
  let left = on.width,
    top = on.height,
    right = -1,
    bottom = -1;
  for (let y = 0; y < on.height; y++)
    for (let x = 0; x < on.width; x++) {
      const offset = (y * on.width + x) * 4;
      if (
        on.data
          .subarray(offset, offset + 4)
          .some(
            (value, channel) =>
              Math.abs(value - off.data[offset + channel]) > 2,
          )
      ) {
        left = Math.min(left, x);
        right = Math.max(right, x);
        top = Math.min(top, y);
        bottom = Math.max(bottom, y);
      }
    }
  assert.ok(
    right >= left && bottom >= top,
    'actual output contains visible watermark ink',
  );
  return {
    left,
    right,
    top,
    bottom,
    imageWidth: on.width,
    imageHeight: on.height,
  };
}
