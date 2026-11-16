import {GIFEncoder, nearestColorIndex, quantize} from 'gifenc';
import type {Size} from '../animation/model';
import type {TimelineScene} from '../animation/timeline';

export type GifConfig = Size & {kind: 'gif'; fps: 25 | 50};
export const gifFps = (requested: number): GifConfig['fps'] =>
  requested >= 50 ? 50 : 25;

// One representative per visible scene includes every hold, however short it
// is relative to the clip. Split transitions each contribute their midpoint.
// The number of samples is bounded by scenes, rather than clip duration.
export function paletteFrameIndices(
  scenes: Pick<TimelineScene, 'durationMs'>[],
  fps: number,
) {
  let startMs = 0;
  const indices: number[] = [];
  for (const scene of scenes) {
    const first = Math.ceil((startMs * fps) / 1000);
    const end = Math.ceil(((startMs + scene.durationMs) * fps) / 1000);
    if (first < end) indices.push(Math.floor((first + end - 1) / 2));
    startMs += scene.durationMs;
  }
  return indices;
}

// Keep the combined palette input below 4M pixels, independently of the
// number of steps and output resolution. Every scene gets the same budget.
export function palettePixels(rgba: Uint8Array, samples = 16) {
  const pixels = rgba.length / 4;
  const count = Math.min(262144, Math.floor(4194304 / samples), pixels);
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
