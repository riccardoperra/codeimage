import {describe, expect, it} from 'vitest';
import {clipFrameCount, frameTimeMs, playedDurationMs} from './clock';

describe('animation clock', () => {
  it('samples frame k at the whole millisecond before k / fps', () => {
    expect([0, 1, 2, 3].map(index => frameTimeMs(index, 24))).toEqual([
      0, 41, 83, 125,
    ]);
  });

  it('plays the last frame for a whole frame', () => {
    expect(
      [24, 25, 30, 50].map(fps => [
        clipFrameCount(2300, fps),
        playedDurationMs(2300, fps),
      ]),
    ).toEqual([
      [56, 2333.3333333333335],
      [58, 2320],
      [69, 2300],
      [115, 2300],
    ]);
  });
});
