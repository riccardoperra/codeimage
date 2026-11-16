import assert from 'node:assert/strict';
import {test} from 'vitest';
import {curveOf, easingOf, formatEasing, parseEasing} from './easing';
import {EASING_CURVES} from './model';

test('parses every preset and canonicalizes its points', () => {
  for (const [name, points] of Object.entries(EASING_CURVES)) {
    assert.equal(parseEasing(name), name);
    assert.equal(parseEasing(points.join(', ')), name);
    assert.equal(parseEasing(`cubic-bezier(${points.join(', ')})`), name);
  }
});

test('rejects invalid x, nonfinite and incomplete curves', () => {
  for (const value of [
    'spring',
    '-.1, 0, 1, 1',
    '0, 0, 1.1, 1',
    'NaN, 0, 1, 1',
    '0,,1,1',
    '0, 1',
    'cubic-bezier(0, 0, 1, 1) extra',
  ])
    assert.equal(parseEasing(value), null);
});

test('clamps y and formats three decimals without exponents', () => {
  assert.equal(parseEasing('.25, -2, .3, 8'), 'cubic-bezier(0.25, 0, 0.3, 1)');
  assert.equal(
    formatEasing([1e-7, 0.123456, 0.30000000000000004, 0.9]),
    'cubic-bezier(0, 0.123, 0.3, 0.9)',
  );
  assert.deepEqual(
    easingOf('cubic-bezier(0.25, 0.1, 0.25, 1)'),
    [0.25, 0.1, 0.25, 1],
  );
  assert.deepEqual(curveOf([-1, -2, 2, 3]), [0, 0, 1, 1]);
});
