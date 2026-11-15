import assert from 'node:assert/strict';
import {test} from 'vitest';
import {resizedDuration} from './createSegmentResize';
const limits = {min: 100, max: 5000};
test('resizes on the frozen scale with 100 ms and Alt 10 ms snapping', () => {
  assert.equal(resizedDuration(700, 13, 1000, 3800, false, limits), 700);
  assert.equal(resizedDuration(700, 13, 1000, 3800, true, limits), 750);
  assert.equal(resizedDuration(700, 100, 1000, 3800, false, limits), 1100);
  assert.equal(resizedDuration(700, -10000, 1000, 3800, true, limits), 100);
  assert.equal(resizedDuration(700, 10000, 1000, 3800, true, limits), 5000);
});
