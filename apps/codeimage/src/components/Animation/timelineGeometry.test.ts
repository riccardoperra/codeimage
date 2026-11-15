import assert from 'node:assert/strict';
import {test} from 'vitest';
import type {AnimationSegment} from '@codeimage/store/editor/animationSettings';
import {timelineGeometry} from './timelineGeometry';

function segments(count: number): AnimationSegment[] {
  let startMs = 0;
  return Array.from({length: count * 2 - 1}, (_, index) => {
    const durationMs = index === 0 ? 10000 : index === 2 ? 0 : 100;
    const segment: AnimationSegment = {
      kind: index % 2 ? 'transition' : 'hold',
      stepId: String(index),
      index: Math.ceil(index / 2),
      startMs,
      durationMs,
    };
    startMs += durationMs;
    return segment;
  });
}

for (const count of [3, 8, 40]) {
  for (const minimum of [8, 40]) {
    test(`${count} steps, ${minimum}px minimum: shared edges, gaps and time round trips`, () => {
      const geometry = timelineGeometry(segments(count), 320, minimum);
      assert.ok(geometry.scale > 0);
      for (const [index, entry] of geometry.entries.entries()) {
        assert.ok(entry.width >= minimum);
        const {startMs, durationMs} = entry.segment;
        assert.equal(geometry.xToTime(entry.x), startMs);
        if (durationMs) {
          assert.equal(geometry.timeToX(startMs), entry.x);
          for (const fraction of [0.01, 0.25, 0.5, 0.99]) {
            const time = startMs + durationMs * fraction;
            assert.ok(
              Math.abs(geometry.xToTime(geometry.timeToX(time)) - time) < 1e-8,
            );
          }
        } else {
          assert.equal(geometry.xToTime(entry.x + entry.width / 2), startMs);
        }
        if (index < geometry.entries.length - 1) {
          assert.equal(
            geometry.entries[index + 1].x,
            entry.x + entry.width + 3,
          );
          assert.equal(
            geometry.xToTime(entry.x + entry.width + 1.5),
            startMs + durationMs,
          );
        }
      }
      assert.equal(geometry.xToTime(-100), 0);
      assert.equal(geometry.timeToX(Infinity), geometry.width);
      assert.equal(
        geometry.xToTime(Infinity),
        geometry.xToTime(geometry.width),
      );
    });
  }
}

test('resizing uses the same frozen geometry and keeps zero holds selectable', () => {
  const initial = segments(40);
  const before = timelineGeometry(initial, 1000);
  const durationMs = before.resizedDuration(initial[0].durationMs, 120);
  const resized = initial.map((segment, index) =>
    index === 0 ? {...segment, durationMs} : segment,
  );
  const during = timelineGeometry(resized, 1000, 8, before.scale);
  assert.ok(
    Math.abs(during.entries[0].width - before.entries[0].width - 120) < 1e-8,
  );
  assert.equal(during.entries[2].width, 8);
});

test('empty and all zero timelines have finite coordinates', () => {
  assert.equal(timelineGeometry([], 0).timeToX(0), 0);
  const geometry = timelineGeometry(
    segments(1).map(segment => ({...segment, durationMs: 0})),
    320,
  );
  assert.equal(geometry.xToTime(100), 0);
  assert.ok(Number.isFinite(geometry.timeToX(0)));
});
