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

for (const count of [3, 8, 15, 30]) {
  for (const width of [320, 1000]) {
    test(`${count} steps, ${width}px width: shared edges, gaps and time round trips`, () => {
      const geometry = timelineGeometry(segments(count), width, {
        labels: true,
        minWidth: 8,
      });
      assert.ok(geometry.scale > 0);
      const positions = geometry.ticks(500).map(tick => tick.x);
      assert.equal(positions[0], 0);
      assert.ok(
        positions.every(
          (x, index) => index === 0 || x - positions[index - 1] >= 64,
        ),
      );
      assert.ok(Math.abs(geometry.width - width) < 1e-8);
      const overview = timelineGeometry(segments(count), width, {
        labels: false,
        minWidth: 8,
      });
      assert.ok(overview.entries.every(entry => entry.label === 'none'));
      assert.deepEqual(
        overview.entries.map(({x, width}) => ({x, width})),
        geometry.entries.map(({x, width}) => ({x, width})),
      );
      for (const [index, entry] of geometry.entries.entries()) {
        assert.ok(entry.width > 0);
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
          assert.ok(
            Math.abs(
              geometry.entries[index + 1].x -
                (entry.x + entry.width + geometry.gap),
            ) < 1e-8,
          );
          assert.equal(
            geometry.xToTime(entry.x + entry.width + geometry.gap / 2),
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

test('drag conversion keeps its captured scale while the displayed geometry fits', () => {
  const initial = segments(30);
  const before = timelineGeometry(initial, 1000);
  const durationMs = before.resizedDuration(initial[0].durationMs, 120);
  const shift = durationMs - initial[0].durationMs;
  const resized = initial.map((segment, index) =>
    index === 0
      ? {...segment, durationMs}
      : {...segment, startMs: segment.startMs + shift},
  );
  const during = timelineGeometry(resized, 1000);
  assert.equal(before.resizedDuration(initial[0].durationMs, 120), durationMs);
  assert.ok(Math.abs(during.width - 1000) < 1e-8);
  assert.equal(during.entries[2].width, 8);
  assert.equal(during.timeToX(resized[1].startMs), during.entries[1].x);
  assert.equal(during.xToTime(during.entries[1].x), resized[1].startMs);
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

test('labels collapse before they overlap', () => {
  const geometry = timelineGeometry(segments(30), 1000);
  assert.ok(geometry.entries.some(entry => entry.label === 'none'));
  assert.ok(geometry.entries.some(entry => entry.label === 'full'));
  const numbered = timelineGeometry(
    segments(8).map((segment, index) => ({
      ...segment,
      durationMs: 800,
      startMs: index * 800,
    })),
    1000,
  );
  assert.ok(numbered.entries.some(entry => entry.label === 'number'));
});

test('a sub-500 ms timeline keeps its sole tick aligned to the start', () => {
  const geometry = timelineGeometry(
    [
      {kind: 'hold', stepId: 'a', index: 0, startMs: 0, durationMs: 0},
      {kind: 'transition', stepId: 'b', index: 1, startMs: 0, durationMs: 300},
      {kind: 'hold', stepId: 'b', index: 1, startMs: 300, durationMs: 0},
    ],
    220,
  );
  assert.deepEqual(geometry.ticks(500), [{ms: 0, x: 0, alignment: 'start'}]);
});

for (const count of [2, 12, 30]) {
  for (const width of [197, 225, 320, 1000]) {
    test(`${count} steps at ${width}px preserve edit targets or request the step list`, () => {
      const geometry = timelineGeometry(segments(count), width);
      assert.equal(geometry.dense, (count * 2 - 1) * 8 >= width);
      assert.ok(Math.abs(geometry.width - width) < 1e-8);
      if (!geometry.dense)
        assert.ok(geometry.entries.every(entry => entry.width >= 8));
      for (const entry of geometry.entries) {
        if (entry.label === 'number')
          assert.ok(
            entry.width >= String(entry.segment.index + 1).length * 7 + 8,
          );
      }
    });
  }
}

for (const width of [320, 390, 1000]) {
  test(`zero first hold anchors time zero at the origin at ${width}px`, () => {
    const timeline = segments(3).map((segment, index) => ({
      ...segment,
      startMs: index === 0 ? 0 : segment.startMs - 10000,
      durationMs: index === 0 ? 0 : segment.durationMs,
    }));
    const geometry = timelineGeometry(timeline, width);
    assert.equal(geometry.timeToX(0), 0);
    assert.equal(geometry.timeToX(-1), 0);
    assert.equal(geometry.xToTime(geometry.entries[0].width / 2), 0);
    assert.ok(geometry.timeToX(1) > geometry.entries[1].x);
    assert.ok(Math.abs(geometry.xToTime(geometry.timeToX(1)) - 1) < 1e-8);
  });
}
