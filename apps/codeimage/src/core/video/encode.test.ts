import {afterEach, describe, expect, it, vi} from 'vitest';
import {
  checkMp4Support,
  evenSize,
  mp4Config,
  padVideoFrame,
  videoFrame,
} from './encode';

afterEach(() => vi.unstubAllGlobals());
describe('MP4 configuration', () => {
  it.each([
    [1919, 1079, 1920, 1080],
    [640, 481, 640, 482],
    [800, 600, 800, 600],
  ])('rounds %dx%d up to even pixels', (width, height, w, h) => {
    expect(evenSize({width, height})).toEqual({width: w, height: h});
  });
  it.each([
    [24, '28'],
    [30, '28'],
    [50, '2a'],
    [60, '2a'],
  ] as const)('uses High profile for 1080p%d', (fps, level) => {
    const config = mp4Config({width: 1920, height: 1080}, fps);
    expect(config.encoder.codec).toBe(`avc1.6400${level}`);
    expect(config.keyframeEvery / fps).toBe(2);
    expect(config.encoder.bitrate).toBeLessThanOrEqual(20_000_000);
  });
  it('chooses a level by macroblocks for portrait and larger frames', () => {
    expect(mp4Config({width: 1080, height: 1350}, 30).encoder.codec).toBe(
      'avc1.640028',
    );
    expect(mp4Config({width: 3840, height: 2160}, 60).encoder.codec).toBe(
      'avc1.640034',
    );
  });
  it('checks the exact encoder configuration', async () => {
    const isConfigSupported = vi.fn(async () => ({supported: true}));
    vi.stubGlobal('VideoEncoder', {isConfigSupported});
    vi.stubGlobal('VideoFrame', class {});
    const config = mp4Config({width: 1919, height: 1079}, 60);
    expect(await checkMp4Support(config)).toEqual({kind: 'supported'});
    expect(isConfigSupported).toHaveBeenCalledWith(config.encoder);
  });
  it('reports missing, rejected and unsupported encoders', async () => {
    vi.stubGlobal('VideoEncoder', undefined);
    expect(
      await checkMp4Support(mp4Config({width: 640, height: 480}, 30)),
    ).toEqual({kind: 'unsupported', reason: 'missing'});
    vi.stubGlobal('VideoFrame', class {});
    vi.stubGlobal('VideoEncoder', {
      isConfigSupported: async () => ({supported: false}),
    });
    expect(
      await checkMp4Support(mp4Config({width: 640, height: 480}, 30)),
    ).toEqual({kind: 'unsupported', reason: 'config'});
    vi.stubGlobal('VideoEncoder', {
      isConfigSupported: async () => {
        throw new Error('denied');
      },
    });
    expect(
      await checkMp4Support(mp4Config({width: 640, height: 480}, 30)),
    ).toMatchObject({reason: 'config', cause: 'denied'});
  });
  it('gives every frame limited BT.709 and gapless microsecond timing', () => {
    const frames: VideoFrameBufferInit[] = [];
    vi.stubGlobal(
      'VideoFrame',
      class {
        constructor(_data: unknown, init: VideoFrameBufferInit) {
          frames.push(init);
        }
      },
    );
    const config = mp4Config({width: 2, height: 2}, 60);
    for (let index = 0; index < 180; index++)
      videoFrame(new Uint8Array(16), config, index);
    for (const [index, frame] of frames.entries()) {
      expect(frame.colorSpace).toEqual({
        primaries: 'bt709',
        transfer: 'bt709',
        matrix: 'bt709',
        fullRange: false,
      });
      expect(frame.timestamp + frame.duration!).toBe(
        index === 179 ? 3_000_000 : frames[index + 1].timestamp,
      );
    }
  });
});

describe('even video frame padding', () => {
  it('extends only the right and bottom edge, preserving background colour and alpha', () => {
    const data = new Uint8Array(4 * 2 * 4);
    data.set([20, 40, 60, 127, 30, 50, 70, 64, 40, 60, 80, 0]);
    padVideoFrame(data, {width: 3, height: 1}, {width: 4, height: 2});
    expect([...data.slice(0, 12)]).toEqual([
      20, 40, 60, 127, 30, 50, 70, 64, 40, 60, 80, 0,
    ]);
    expect([...data.slice(12, 16)]).toEqual([40, 60, 80, 0]);
    expect(data.slice(16)).toEqual(data.slice(0, 16));
  });
  it('leaves an already-even frame unchanged', () => {
    const data = Uint8Array.from({length: 16}, (_, index) => index);
    const before = data.slice();
    padVideoFrame(data, {width: 2, height: 2}, {width: 2, height: 2});
    expect(data).toEqual(before);
  });
});
