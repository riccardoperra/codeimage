import {GIFEncoder, nearestColorIndex, quantize} from 'gifenc';
import type {Size} from '../animation/model';

export type GifConfig = Size & {kind: 'gif'; fps: 25 | 50};
export const gifFps = (requested: number): GifConfig['fps'] =>
  requested >= 50 ? 50 : 25;

export function paletteFrameIndices(total: number) {
  const count = Math.min(16, total);
  return Array.from({length: count}, (_, index) =>
    Math.round((index * (total - 1)) / Math.max(1, count - 1)),
  );
}

// Bound palette memory independently of clip length and output resolution.
// Sample across the entire image, retaining all pixels of smaller frames.
export function palettePixels(rgba: Uint8Array) {
  const pixels = rgba.length / 4;
  const count = Math.min(262144, pixels);
  const sample = new Uint8Array(count * 4);
  for (let i = 0; i < count; i++) {
    const at = Math.floor((i * pixels) / count) * 4;
    sample.set(rgba.subarray(at, at + 4), i * 4);
  }
  return sample;
}

// Unlike applyPalette's per-frame RGB565 cache, every exact RGB colour has
// one entry for the whole clip. Unchanged pixels cannot flicker.
export function stableIndexer(palette: number[][]) {
  const cache = new Int16Array(1 << 24).fill(-1);
  return (rgba: Uint8Array) => {
    const indexed = new Uint8Array(rgba.length / 4);
    for (let pixel = 0; pixel < indexed.length; pixel++) {
      const at = pixel * 4;
      const key = rgba[at] | (rgba[at + 1] << 8) | (rgba[at + 2] << 16);
      let entry = cache[key];
      if (entry < 0)
        entry = cache[key] = nearestColorIndex(palette, [
          rgba[at],
          rgba[at + 1],
          rgba[at + 2],
        ]);
      indexed[pixel] = entry;
    }
    return indexed;
  };
}

export function sameFrame(a: Uint8Array, b: Uint8Array) {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}

export function createGifEncoder(config: GifConfig, samples: Uint8Array[]) {
  const packed = new Uint8Array(samples.reduce((n, s) => n + s.length, 0));
  let offset = 0;
  for (const sample of samples) {
    packed.set(sample, offset);
    offset += sample.length;
  }
  const palette = quantize(packed, 256);
  const index = stableIndexer(palette);
  const gif = GIFEncoder();
  let pending: Uint8Array | undefined;
  let count = 0;
  let written = 0;
  const flush = () => {
    if (!pending) return;
    // A GIF delay is an unsigned 16-bit number of centiseconds. Split very
    // long holds rather than allowing the encoder to wrap their duration.
    const limit = Math.floor(655350 / (1000 / config.fps));
    while (count > 0) {
      const frames = Math.min(count, limit);
      gif.writeFrame(pending, config.width, config.height, {
        palette: written++ === 0 ? palette : undefined,
        delay: frames * (1000 / config.fps),
        dispose: 1,
        transparent: false,
        repeat: 0,
      });
      count -= frames;
    }
  };
  return {
    add(rgba: Uint8Array, _index: number) {
      const next = index(rgba);
      if (pending && sameFrame(pending, next)) {
        count++;
      } else {
        flush();
        pending = next;
        count = 1;
      }
    },
    finish() {
      flush();
      gif.finish();
      return gif.bytes().slice().buffer;
    },
    close() {
      pending = undefined;
    },
  };
}
