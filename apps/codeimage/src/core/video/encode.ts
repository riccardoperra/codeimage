import {
  BufferTarget,
  EncodedPacket,
  EncodedVideoPacketSource,
  Mp4OutputFormat,
  Output,
} from 'mediabunny';
import type {AnimationSettings, Size} from '../animation/model';

export type VideoFps = AnimationSettings['fps'];
export type Mp4Config = {
  encoder: VideoEncoderConfig;
  fps: VideoFps;
  width: number;
  height: number;
  keyframeEvery: number;
  colorSpace: VideoColorSpaceInit;
};
export type Mp4Support =
  | {kind: 'supported'}
  | {kind: 'unsupported'; reason: 'missing' | 'config'; cause?: string};

export function evenSize({width, height}: Size): Size {
  return {width: Math.ceil(width / 2) * 2, height: Math.ceil(height / 2) * 2};
}

export function mp4Config(size: Size, fps: VideoFps): Mp4Config {
  const {width, height} = evenSize(size);
  const blocks = Math.ceil(width / 16) * Math.ceil(height / 16);
  // H.264 levels constrain macroblocks per frame as well as per second.
  const level =
    blocks <= 8192 && blocks * fps <= 245760
      ? '28'
      : blocks <= 8704 && blocks * fps <= 522240
        ? '2a'
        : blocks <= 22080 && blocks * fps <= 589824
          ? '32'
          : blocks <= 36864 && blocks * fps <= 983040
            ? '33'
            : '34';
  return {
    width,
    height,
    fps,
    encoder: {
      codec: `avc1.6400${level}`,
      width,
      height,
      framerate: fps,
      bitrate: Math.min(
        20_000_000,
        Math.max(500_000, Math.round(width * height * fps * 0.075)),
      ),
      bitrateMode: 'variable',
      latencyMode: 'realtime',
      hardwareAcceleration: 'no-preference',
      avc: {format: 'avc'},
    },
    keyframeEvery: fps * 2,
    colorSpace: {
      primaries: 'bt709',
      transfer: 'bt709',
      matrix: 'bt709',
      fullRange: false,
    },
  };
}

export async function checkMp4Support(config: Mp4Config): Promise<Mp4Support> {
  if (typeof VideoEncoder === 'undefined' || typeof VideoFrame === 'undefined')
    return {kind: 'unsupported', reason: 'missing'};
  try {
    const result = await VideoEncoder.isConfigSupported(config.encoder);
    return result.supported
      ? {kind: 'supported'}
      : {kind: 'unsupported', reason: 'config'};
  } catch (error) {
    return {kind: 'unsupported', reason: 'config', cause: errorMessage(error)};
  }
}

export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export function videoFrame(
  data: Uint8Array<ArrayBuffer>,
  config: Mp4Config,
  index: number,
): VideoFrame {
  return new VideoFrame(data, {
    format: 'RGBA',
    codedWidth: config.width,
    codedHeight: config.height,
    timestamp: Math.round((index * 1_000_000) / config.fps),
    duration:
      Math.round(((index + 1) * 1_000_000) / config.fps) -
      Math.round((index * 1_000_000) / config.fps),
    colorSpace: config.colorSpace,
  });
}

export async function warmEncoder(config: Mp4Config) {
  let failure: Error | undefined;
  const encoder = new VideoEncoder({
    output() {},
    error: error => {
      failure = error;
    },
  });
  try {
    encoder.configure(config.encoder);
    const frame = videoFrame(
      new Uint8Array(config.width * config.height * 4),
      config,
      0,
    );
    try {
      encoder.encode(frame, {keyFrame: true});
    } finally {
      frame.close();
    }
    await encoder.flush();
    if (failure) throw failure;
  } finally {
    if (encoder.state !== 'closed') encoder.close();
  }
}

export async function createMp4Encoder(config: Mp4Config) {
  const target = new BufferTarget();
  const output = new Output({
    target,
    format: new Mp4OutputFormat({fastStart: 'in-memory'}),
  });
  const source = new EncodedVideoPacketSource('avc');
  output.addVideoTrack(source, {frameRate: config.fps});
  let writing = Promise.resolve();
  let failure: unknown;
  const encoder = new VideoEncoder({
    output: (chunk, meta) => {
      writing = writing.then(() =>
        source.add(EncodedPacket.fromEncodedChunk(chunk), meta),
      );
      writing.catch(error => {
        failure = error;
      });
    },
    error: error => {
      failure = error;
    },
  });
  try {
    encoder.configure(config.encoder);
    await output.start();
  } catch (error) {
    if (encoder.state !== 'closed') encoder.close();
    await output.cancel();
    throw error;
  }
  const check = () => {
    if (failure) throw failure;
  };
  return {
    async add(data: Uint8Array<ArrayBuffer>, index: number) {
      check();
      // Yield to the encoder without retaining a queue of raw 1080p frames.
      while (encoder.encodeQueueSize >= 3) {
        await new Promise<void>(resolve => setTimeout(resolve, 0));
        check();
      }
      const frame = videoFrame(data, config, index);
      try {
        encoder.encode(frame, {keyFrame: index % config.keyframeEvery === 0});
      } finally {
        frame.close();
      }
    },
    async finish() {
      await encoder.flush();
      await writing;
      check();
      await output.finalize();
      if (!target.buffer) throw new Error('MP4 muxer returned no data');
      return target.buffer;
    },
    async close() {
      if (encoder.state !== 'closed') encoder.close();
      if (output.state !== 'finalized') await output.cancel();
    },
  };
}
