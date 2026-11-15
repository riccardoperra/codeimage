import {describe, expect, it} from 'vitest';
import {decodeGif} from '../../../../../scripts/parity/gif-decoder';
import {
  createGifEncoder,
  gifFps,
  paletteFrameIndices,
  palettePixels,
  stableIndexer,
} from './encode';
const rgba = (...colors: number[][]) =>
  new Uint8Array(colors.flatMap(c => [...c, 255]));

describe('GIF palette and timing', () => {
  it('maps exact colours consistently even when their RGB565 bin changes order', () => {
    const index = stableIndexer([
      [4, 0, 0],
      [7, 0, 0],
    ]);
    const first = index(rgba([5, 0, 0], [6, 0, 0]));
    const next = index(rgba([7, 0, 0], [6, 0, 0]));
    expect([...first]).toEqual([0, 1]);
    expect(next[1]).toBe(first[1]);
  });
  it.each([
    [25, 25],
    [50, 50],
    [60, 50],
  ] as const)('maps requested %d to %d fps', (requested, actual) => {
    expect(gifFps(requested)).toBe(actual);
  });
  it('samples both ends without duplicates, bounded to sixteen frames', () => {
    expect(paletteFrameIndices(1)).toEqual([0]);
    expect(paletteFrameIndices(3)).toEqual([0, 1, 2]);
    const indices = paletteFrameIndices(150);
    expect(indices).toHaveLength(16);
    expect(new Set(indices).size).toBe(16);
    expect(indices[0]).toBe(0);
    expect(indices.at(-1)).toBe(149);
    const frame = new Uint8Array(1_000_000 * 4).fill(255);
    expect(palettePixels(frame).length).toBe(262144 * 4);
    expect(palettePixels(rgba([5, 6, 7]))).toEqual(rgba([5, 6, 7]));
  });
  it.each([25, 50] as const)(
    'merges holds, uses one global palette and replaces every pixel at %d fps',
    fps => {
      const a = rgba([255, 0, 0], [0, 255, 0]);
      const b = rgba([0, 0, 255], [0, 255, 0]);
      const encoder = createGifEncoder(
        {kind: 'gif', width: 2, height: 1, fps},
        [a, b],
      );
      for (let i = 0; i < fps; i++) encoder.add(i < fps - 1 ? a : b, i);
      const frames = [...decodeGif(new Uint8Array(encoder.finish()))];
      expect(frames).toHaveLength(2);
      expect(frames.reduce((n, f) => n + f.delayMs, 0)).toBe(1000);
      expect(frames.every(f => !f.localPalette && f.disposal === 1)).toBe(true);
      expect(frames[0].rgba).toEqual(a);
      expect(frames[1].rgba).toEqual(b);
    },
  );
  it('merges visually identical quantized frames and splits holds beyond the GIF delay limit', () => {
    const a = rgba([255, 0, 0]);
    const encoder = createGifEncoder(
      {kind: 'gif', width: 1, height: 1, fps: 25},
      [a],
    );
    for (let i = 0; i < 17000; i++) encoder.add(a, i);
    const frames = [...decodeGif(new Uint8Array(encoder.finish()))];
    expect(frames).toHaveLength(2);
    expect(frames.reduce((n, f) => n + f.delayMs, 0)).toBe(680000);
    expect(frames.every(f => f.delayMs <= 655350)).toBe(true);
  });
});
