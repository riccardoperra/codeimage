import {spawn} from 'node:child_process';
import {constants} from 'node:fs';
import {access, rename, rm, stat} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import {tmpdir} from 'node:os';
import {delimiter, join, resolve} from 'node:path';
import type {AnimationFrame, RawAnimation} from '@codeimage/render';
import {UsageError} from '../errors';
import {downloadFfmpeg, FFMPEG_HELP} from './download';
import type {DownloadOptions} from './download';
import {trackEncoder, trackPartial} from './lifecycle';

async function executable(path: string) {
  try {
    await access(
      path,
      process.platform === 'win32' ? constants.F_OK : constants.X_OK,
    );
    return (await stat(path)).isFile();
  } catch {
    return false;
  }
}

export async function resolveFfmpeg({
  path,
  env = process.env,
  download = downloadFfmpeg,
  ...options
}: DownloadOptions & {
  path?: string;
  env?: NodeJS.ProcessEnv;
  download?: typeof downloadFfmpeg;
} = {}) {
  for (const candidate of [path, env.CODEIMAGE_FFMPEG]) {
    if (candidate && (await executable(candidate))) return resolve(candidate);
  }
  const extensions =
    process.platform === 'win32'
      ? (env.PATHEXT ?? '.EXE;.CMD;.BAT;.COM').split(';')
      : [''];
  for (const folder of env.PATH?.split(delimiter) ?? []) {
    for (const extension of extensions) {
      const candidate = resolve(folder, `ffmpeg${extension}`);
      if (await executable(candidate)) return candidate;
    }
  }
  return download(options);
}

export function ffmpegArgs({
  width,
  height,
  fps,
  output,
}: {
  width: number;
  height: number;
  fps: number;
  output: string;
}) {
  const evenWidth = Math.ceil(width / 2) * 2;
  const evenHeight = Math.ceil(height / 2) * 2;
  const blocks = Math.ceil(evenWidth / 16) * Math.ceil(evenHeight / 16);
  const level =
    blocks <= 8192 && blocks * fps <= 245760
      ? '4.0'
      : blocks <= 8704 && blocks * fps <= 522240
        ? '4.2'
        : blocks <= 22080 && blocks * fps <= 589824
          ? '5.0'
          : blocks <= 36864 && blocks * fps <= 983040
            ? '5.1'
            : '5.2';
  const bitrate = Math.min(
    20_000_000,
    Math.max(500_000, Math.round(evenWidth * evenHeight * fps * 0.075)),
  );
  return [
    '-hide_banner',
    '-loglevel',
    'error',
    '-nostdin',
    '-y',
    '-f',
    'rawvideo',
    '-pix_fmt',
    'rgba',
    '-s:v',
    `${evenWidth}x${evenHeight}`,
    '-r',
    String(fps),
    '-i',
    'pipe:0',
    '-an',
    '-c:v',
    'libx264',
    '-preset',
    'veryfast',
    '-profile:v',
    'high',
    '-level:v',
    level,
    '-pix_fmt',
    'yuv420p',
    '-b:v',
    String(bitrate),
    '-g',
    String(fps * 2),
    '-keyint_min',
    String(fps * 2),
    '-sc_threshold',
    '0',
    '-vf',
    'scale=out_color_matrix=bt709:out_range=tv,setparams=colorspace=bt709:color_primaries=bt709:color_trc=bt709:range=limited',
    '-colorspace',
    'bt709',
    '-color_primaries',
    'bt709',
    '-color_trc',
    'bt709',
    '-color_range',
    'tv',
    '-movflags',
    '+faststart',
    '-f',
    'mp4',
    output,
  ];
}

export function padFrame({width, height, rgba}: AnimationFrame) {
  if (rgba.byteLength !== width * height * 4)
    throw new Error('Invalid raw RGBA frame size');
  const evenWidth = Math.ceil(width / 2) * 2;
  const evenHeight = Math.ceil(height / 2) * 2;
  if (evenWidth === width && evenHeight === height) return rgba;
  const data = Buffer.allocUnsafe(evenWidth * evenHeight * 4);
  const stride = evenWidth * 4;
  for (let row = 0; row < height; row++) {
    data.set(
      rgba.subarray(row * width * 4, (row + 1) * width * 4),
      row * stride,
    );
    if (evenWidth > width)
      data.copy(
        data,
        row * stride + width * 4,
        row * stride + (width - 1) * 4,
        row * stride + width * 4,
      );
  }
  if (evenHeight > height)
    data.copy(data, height * stride, (height - 1) * stride, height * stride);
  return data;
}

export async function exportMp4({
  animation,
  ffmpeg,
  output,
}: {
  animation: RawAnimation;
  ffmpeg: string;
  output: string;
}) {
  const target =
    output === '-'
      ? join(tmpdir(), `codeimage-${randomUUID()}.mp4`)
      : resolve(output);
  const partial = `${target}.${process.pid}.${randomUUID()}.partial`;
  const untrack = trackPartial(partial);
  const child = spawn(ffmpeg, ffmpegArgs({...animation, output: partial}), {
    stdio: ['pipe', 'ignore', 'pipe'],
    windowsHide: true,
  });
  const untrackChild = trackEncoder(child);
  let stderr = '';
  child.stderr.setEncoding('utf8').on('data', (chunk: string) => {
    stderr = (stderr + chunk).slice(-8192);
  });
  // Errors can arrive during a native frame render, before the next write.
  child.stdin.on('error', () => {});
  const finished = new Promise<void>((resolve, reject) => {
    child.once('error', reject);
    child.once('close', code =>
      code === 0
        ? resolve()
        : reject(new Error(`ffmpeg exited ${code}: ${stderr.trim()}`)),
    );
  });
  void finished.catch(() => {});
  try {
    for await (const frame of animation.frames) {
      if (frame.width !== animation.width || frame.height !== animation.height)
        throw new Error('Animation frame dimensions changed');
      await new Promise<void>((resolve, reject) => {
        child.stdin.write(padFrame(frame), error =>
          error ? reject(error) : resolve(),
        );
      });
    }
    child.stdin.end();
    await finished;
    const {size: bytes} = await stat(partial);
    if (output === '-') {
      const {createReadStream} = await import('node:fs');
      for await (const chunk of createReadStream(partial)) {
        await new Promise<void>((resolve, reject) =>
          process.stdout.write(chunk, error =>
            error ? reject(error) : resolve(),
          ),
        );
      }
    } else await rename(partial, target);
    return {bytes};
  } catch (cause) {
    throw new UsageError(
      `MP4 export failed: ${cause instanceof Error ? cause.message : String(cause)}. ${FFMPEG_HELP}`,
      {cause},
    );
  } finally {
    if (child.exitCode === null && child.signalCode === null)
      child.kill('SIGKILL');
    await finished.catch(() => {});
    untrackChild();
    await rm(partial, {force: true});
    untrack();
  }
}
