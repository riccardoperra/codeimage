import {describe, expect, it, vi} from 'vitest';
import {
  ANIMATION_FORMATS,
  animationConfig,
  checkAnimationSupport,
  estimateDistinctFrames,
  preferredAnimationFormat,
  GIF_SUGGEST_MP4_BYTES,
} from './formats';

describe('animation format table', () => {
  it('offers MP4 first with matching metadata and format-specific rates', () => {
    expect(Object.keys(ANIMATION_FORMATS)).toEqual(['mp4', 'gif']);
    expect(ANIMATION_FORMATS.mp4).toMatchObject({
      extension: 'mp4',
      mime: 'video/mp4',
      defaultFps: 30,
      fpsOptions: [24, 30, 50, 60],
    });
    expect(ANIMATION_FORMATS.gif).toMatchObject({
      extension: 'gif',
      mime: 'image/gif',
      defaultFps: 25,
      fpsOptions: [25, 50, 60],
    });
    expect(animationConfig('mp4', {width: 641, height: 481}, 60)).toMatchObject(
      {kind: 'mp4', width: 642, height: 482, fps: 60},
    );
    expect(animationConfig('gif', {width: 641, height: 481}, 60)).toEqual({
      kind: 'gif',
      width: 641,
      height: 481,
      fps: 50,
    });
  });
  it('counts holds once and estimates from distinct frames rather than clip length', () => {
    const scenes = [
      {kind: 'hold', durationMs: 1000},
      {kind: 'transition', durationMs: 600},
      {kind: 'hold', durationMs: 1000},
    ] as const;
    const distinctFrames = estimateDistinctFrames([...scenes], 25);
    expect(distinctFrames).toBe(17);
    const input = {
      width: 1920,
      height: 1080,
      fps: 25 as const,
      durationMs: 2600,
      distinctFrames,
    };
    expect(ANIMATION_FORMATS.gif.estimate(input)).toBe(
      1920 * 1080 * 17 * 0.043,
    );
    expect(ANIMATION_FORMATS.gif.estimate({...input, durationMs: 100000})).toBe(
      ANIMATION_FORMATS.gif.estimate(input),
    );
    expect(
      ANIMATION_FORMATS.gif.estimate({...input, distinctFrames: 100}),
    ).toBeGreaterThan(GIF_SUGGEST_MP4_BYTES);
    expect(ANIMATION_FORMATS.mp4.estimate({...input, fps: 30})).toBeGreaterThan(
      0,
    );
  });
  it('falls back to GIF only when MP4 is unavailable and needs no WebCodecs for GIF', async () => {
    expect(
      preferredAnimationFormat('mp4', {kind: 'unsupported', reason: 'missing'}),
    ).toBe('gif');
    expect(
      preferredAnimationFormat('mp4', {kind: 'unsupported', reason: 'config'}),
    ).toBe('gif');
    expect(preferredAnimationFormat('mp4', {kind: 'supported'})).toBe('mp4');
    expect(preferredAnimationFormat('gif', {kind: 'supported'})).toBe('gif');
    vi.stubGlobal('VideoEncoder', undefined);
    try {
      expect(
        await checkAnimationSupport(
          animationConfig('gif', {width: 2, height: 1}, 25),
        ),
      ).toEqual({kind: 'supported'});
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
