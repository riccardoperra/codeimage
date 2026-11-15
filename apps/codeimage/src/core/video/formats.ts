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
} from './encode';

export type AnimationConfig = Mp4Config | GifConfig;
export type AnimationFormat = AnimationConfig['kind'];
export type AnimationFps = AnimationSettings['fps'] | 25;
type Estimate = Size & {
  fps: AnimationFps;
  durationMs: number;
  distinctFrames: number;
};

export const ANIMATION_FORMATS = {
  mp4: {
    label: 'MP4',
    extension: 'mp4',
    mime: 'video/mp4',
    defaultFps: 30 as const,
    fpsOptions: [24, 30, 50, 60] satisfies AnimationFps[],
    config: (size: Size, fps: AnimationFps): Mp4Config =>
      mp4Config(size, fps === 25 ? 30 : fps),
    estimate: ({width, height, fps, durationMs}: Estimate) =>
      (Number(
        mp4Config({width, height}, fps === 25 ? 30 : fps).encoder.bitrate,
      ) *
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
    fpsOptions: [25, 50, 60] satisfies AnimationFps[],
    config: (size: Size, fps: AnimationFps): GifConfig => ({
      kind: 'gif',
      width: Math.ceil(size.width),
      height: Math.ceil(size.height),
      fps: gifFps(fps),
    }),
    estimate: ({width, height, distinctFrames}: Estimate) =>
      width * height * distinctFrames * 0.043,
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

// Holds cost one GIF frame. Transitions are sampled at the output frame rate.
export function estimateDistinctFrames(
  scenes: Pick<TimelineScene, 'kind' | 'durationMs'>[],
  fps: number,
) {
  return scenes.reduce(
    (sum, scene) =>
      sum +
      (scene.kind === 'hold'
        ? 1
        : Math.max(1, Math.ceil((scene.durationMs * fps) / 1000))),
    0,
  );
}

export function preferredAnimationFormat(
  requested: AnimationFormat,
  mp4: Mp4Support,
): AnimationFormat {
  return requested === 'mp4' && mp4.kind === 'unsupported' ? 'gif' : requested;
}
