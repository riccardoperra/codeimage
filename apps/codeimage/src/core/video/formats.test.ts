import {describe, expect, it, vi} from 'vitest';
import {createGifEncoder} from '../gif/encode';
import {decodeGif} from '../gif/decode.test-utils';
import {
  ANIMATION_FORMATS,
  animationConfig,
  checkAnimationSupport,
  gifFrameBudget,
  preferredAnimationFormat,
  nearestAnimationFps,
  GIF_SUGGEST_MP4_BYTES,
} from './formats';

describe('animation format table', () => {
  it('offers MP4 first with matching metadata and format-specific rates', () => {
    expect(Object.keys(ANIMATION_FORMATS)).toEqual(['mp4', 'gif']);
    expect(ANIMATION_FORMATS.gif.frameRate(60)).toBe(50);
    expect(ANIMATION_FORMATS.gif.frameRate(25)).toBe(25);
    expect(ANIMATION_FORMATS.mp4.frameRate(60)).toBe(60);
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
  it('uses the global frame clock and merges arbitrarily long holds', () => {
    const scenes = [
      {kind: 'hold', durationMs: 8700},
      {kind: 'transition', durationMs: 350, activeRanges: [[0, 350]]},
      {kind: 'transition', durationMs: 350, activeRanges: [[0, 350]]},
      {kind: 'hold', durationMs: 800},
    ] as const;
    expect(gifFrameBudget([...scenes], 25)).toBe(19);
    expect(
      gifFrameBudget(
        [
          {kind: 'hold', durationMs: 1000},
          {kind: 'transition', durationMs: 350, activeRanges: [[0, 350]]},
          {kind: 'transition', durationMs: 350, activeRanges: [[0, 350]]},
          {kind: 'hold', durationMs: 1000},
        ],
        25,
      ),
    ).toBe(20);
    expect(gifFrameBudget([{kind: 'hold', durationMs: 100000}], 25)).toBe(1);
    expect(
      gifFrameBudget(
        [
          {kind: 'hold', durationMs: 1},
          {kind: 'hold', durationMs: 1},
        ],
        25,
      ),
    ).toBe(1);
  });
  it('matches encoded hold merging on a shared clock with split transitions', () => {
    const scenes = [
      {kind: 'hold', durationMs: 8700},
      {kind: 'transition', durationMs: 350, activeRanges: [[0, 350]]},
      {kind: 'transition', durationMs: 350, activeRanges: [[0, 350]]},
      {kind: 'hold', durationMs: 800},
    ] as const;
    const frames = Array.from(
      {length: 235},
      (_, i) =>
        new Uint8Array([
          i < 218 ? 0 : i < 235 ? (i - 217) * 12 : 255,
          0,
          0,
          255,
        ]),
    );
    frames.push(new Uint8Array([255, 0, 0, 255]));
    const encoder = createGifEncoder(
      {kind: 'gif', width: 1, height: 1, fps: 25},
      frames,
    );
    for (let i = 0; i < 255; i++) encoder.add(frames[Math.min(i, 235)], i);
    expect([...decodeGif(new Uint8Array(encoder.finish()))]).toHaveLength(
      gifFrameBudget([...scenes], 25),
    );
  });
  it('collapses the static pause in fade-only transitions', () => {
    const hold = {kind: 'hold', durationMs: 600} as const;
    expect(
      gifFrameBudget(
        [
          hold,
          {
            kind: 'transition',
            durationMs: 300,
            activeRanges: [
              [0, 180],
              [420, 600],
            ],
          },
          {
            kind: 'transition',
            durationMs: 300,
            activeRanges: [
              [-300, -120],
              [120, 300],
            ],
          },
          hold,
        ],
        25,
      ),
    ).toBe(12);
  });
  it('budgets text edges, scale and visible backgrounds separately', () => {
    const input = {
      width: 592,
      height: 507,
      fps: 25 as const,
      durationMs: 3000,
      frameBudget: 33,
      pixelRatio: 1,
      textArea: 100000,
      background: true,
    };
    const estimate = ANIMATION_FORMATS.gif.estimate(input);
    expect(estimate).toBeGreaterThan(0);
    expect(ANIMATION_FORMATS.gif.estimate({...input, durationMs: 100000})).toBe(
      estimate,
    );
    expect(
      ANIMATION_FORMATS.gif.estimate({...input, background: false}),
    ).toBeLessThan(estimate);
    expect(
      ANIMATION_FORMATS.gif.estimate({...input, textArea: 10000}),
    ).toBeLessThan(estimate);
    expect(
      ANIMATION_FORMATS.gif.estimate({
        ...input,
        width: 1184,
        height: 1014,
        pixelRatio: 2,
      }),
    ).toBeLessThan(estimate * 4);
    expect(
      ANIMATION_FORMATS.gif.estimate({...input, frameBudget: 400}),
    ).toBeGreaterThan(GIF_SUGGEST_MP4_BYTES);
    expect(ANIMATION_FORMATS.mp4.estimate({...input, fps: 30})).toBeGreaterThan(
      0,
    );
  });
  it.each([
    ['gif', 24, 25],
    ['mp4', 25, 24],
    ['gif', 50, 50],
    ['mp4', 50, 50],
    ['gif', 60, 60],
  ] as const)(
    'keeps compatible rates and clamps %s %d to %d',
    (format, from, to) => {
      expect(nearestAnimationFps(format, from)).toBe(to);
    },
  );
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
