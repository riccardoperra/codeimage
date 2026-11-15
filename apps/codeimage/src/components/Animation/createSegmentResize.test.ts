import assert from 'node:assert/strict';
import {test} from 'vitest';
import {snapDuration} from './createSegmentResize';
const limits = {min: 100, max: 5000};
test('snaps a resized duration to 100 ms or Alt 10 ms within its limits', () => {
  assert.equal(snapDuration(749, false, limits), 700);
  assert.equal(snapDuration(749, true, limits), 750);
  assert.equal(snapDuration(1080, false, limits), 1100);
  assert.equal(snapDuration(-10000, true, limits), 100);
  assert.equal(snapDuration(10000, true, limits), 5000);
});
