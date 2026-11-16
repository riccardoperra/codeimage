import type {AnimationSettings, Size} from '../animation/model';
import type {TimelineScene} from '../animation/timeline';
import {createGifEncoder, gifFps, type GifConfig} from '../gif/encode';
import {
  checkMp4Support,
  createMp4Encoder,
  mp4Config,
  warmEncoder,
  type Mp4Config,
  type Mp4Support,
  type VideoFps,
} from './encode';

export type AnimationConfig = Mp4Config | GifConfig;
export type AnimationFormat = AnimationConfig['kind'];
export type AnimationFps = AnimationSettings['fps'] | 25;
type Estimate = Size & {
  fps: AnimationFps;
  durationMs: number;
  frameBudget: number;
  pixelRatio: number;
  textArea: number;
  background: boolean;
};

const mp4Fps = (fps: AnimationFps): VideoFps => (fps === 25 ? 30 : fps);

export const ANIMATION_FORMATS = {
  mp4: {
    label: 'MP4',
    extension: 'mp4',
    mime: 'video/mp4',
    defaultFps: 30 as const,
    frameRate: mp4Fps,
    fpsOptions: [24, 30, 50, 60] satisfies AnimationFps[],
    config: (size: Size, fps: AnimationFps): Mp4Config =>
      mp4Config(size, mp4Fps(fps)),
    estimate: ({width, height, fps, durationMs}: Estimate) =>
      (Number(mp4Config({width, height}, mp4Fps(fps)).encoder.bitrate) *
        durationMs) /
      8000,
    check: checkMp4Support,
    warm: warmEncoder,
    create: createMp4Encoder,
    paletteSamples: false,
  },
  gif: {
    label: 'GIF',
    extension: 'gif',
    mime: 'image/gif',
    defaultFps: 25 as const,
    frameRate: gifFps,
    fpsOptions: [25, 50, 60] satisfies AnimationFps[],
    config: (size: Size, fps: AnimationFps): GifConfig => ({
      kind: 'gif',
      width: Math.ceil(size.width),
      height: Math.ceil(size.height),
      fps: gifFps(fps),
    }),
    // Text edges grow more slowly than pixel area as scale increases. A
    // separate background term avoids charging a hidden frame for gradients.
    // Coefficients and the 20% headroom are calibrated by the Chrome matrix
    // in docs/plans/a5-verification.md, rather than by elapsed clip length.
    estimate: ({
      width,
      height,
      frameBudget,
      pixelRatio,
      textArea,
      background,
    }: Estimate) => {
      const text = textArea * 0.2 * pixelRatio ** 1.2;
      const chrome = 2500 * pixelRatio ** 1.2;
      const backdrop = background
        ? (width * height) ** 0.65 * 3.1
        : Math.sqrt(width * height) * 2;
      return 800 + (text + chrome + backdrop) * frameBudget * 1.2;
    },
    check: async (_config: GifConfig): Promise<Mp4Support> => ({
      kind: 'supported',
    }),
    warm: async (_config: GifConfig) => {},
    create: createGifEncoder,
    paletteSamples: true,
  },
};
export const GIF_SUGGEST_MP4_BYTES = 8_000_000;

export function animationConfig(
  format: AnimationFormat,
  size: Size,
  fps: AnimationFps,
) {
  return ANIMATION_FORMATS[format].config(size, fps);
}
export function checkAnimationSupport(config: AnimationConfig) {
  return config.kind === 'mp4'
    ? ANIMATION_FORMATS.mp4.check(config)
    : ANIMATION_FORMATS.gif.check(config);
}
export function warmAnimationEncoder(config: AnimationConfig) {
  return config.kind === 'mp4'
    ? ANIMATION_FORMATS.mp4.warm(config)
    : ANIMATION_FORMATS.gif.warm(config);
}
export function createAnimationEncoder(
  config: AnimationConfig,
  samples: Uint8Array[],
) {
  return config.kind === 'mp4'
    ? ANIMATION_FORMATS.mp4.create(config)
    : ANIMATION_FORMATS.gif.create(config, samples);
}

// The worker samples on one global clock, not a fresh clock per half-scene.
// Budget one frame per visible hold, exactly as the GIF encoder merges it.
// Collapse the compiler's static fade plateaus too. Quantization can merge
// additional poses, so the remaining transition count is an upper bound.
export function gifFrameBudget(
  scenes: (
    | {kind: 'hold'; durationMs: number}
    | Pick<
        Extract<TimelineScene, {kind: 'transition'}>,
        'kind' | 'durationMs' | 'activeRanges'
      >
  )[],
  fps: number,
) {
  let startMs = 0;
  let count = 0;
  for (const [index, scene] of scenes.entries()) {
    const first = Math.ceil((startMs * fps) / 1000);
    const end = Math.ceil(((startMs + scene.durationMs) * fps) / 1000);
    const frames = end - first;
    if (scene.kind === 'hold') count += Number(frames > 0);
    else {
      let previous = -1;
      for (let frame = first; frame < end; frame++) {
        const timeMs = Math.floor((frame * 1000) / fps) - startMs;
        const pose = scene.activeRanges.reduce(
          (sum, [start, end]) =>
            sum + Math.max(0, Math.min(timeMs - start, end - start)),
          0,
        );
        const repeatsHold =
          timeMs === 0 &&
          scene.activeRanges.length > 1 &&
          scenes[index - 1]?.kind === 'hold';
        if (pose !== previous && !repeatsHold) count++;
        previous = pose;
      }
    }
    startMs += scene.durationMs;
  }
  return count;
}

export function nearestAnimationFps(
  format: AnimationFormat,
  fps: AnimationFps,
) {
  return ANIMATION_FORMATS[format].fpsOptions.reduce<AnimationFps>(
    (nearest, value) =>
      Math.abs(value - fps) < Math.abs(nearest - fps) ? value : nearest,
    ANIMATION_FORMATS[format].defaultFps,
  );
}

export function preferredAnimationFormat(
  requested: AnimationFormat,
  mp4: Mp4Support,
): AnimationFormat {
  return requested === 'mp4' && mp4.kind === 'unsupported' ? 'gif' : requested;
}
