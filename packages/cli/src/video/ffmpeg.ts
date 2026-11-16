import {spawn} from 'node:child_process';
import {constants} from 'node:fs';
import {access, rename, rm, stat} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import {tmpdir} from 'node:os';
import {join, resolve, posix, win32} from 'node:path';
import type {AnimationFrame, RawAnimation} from '@codeimage/render';
import {UsageError} from '../errors';
import type {Ui} from '../ui';
import {trackEncoder, trackPartial} from './lifecycle';

const FFMPEG_HELP =
  'Provide ffmpeg with libx264 using --ffmpeg <path>, CODEIMAGE_FFMPEG, or ffmpeg on PATH.';

function installInstructions(platform: NodeJS.Platform) {
  if (platform === 'darwin')
    return `Install Homebrew from https://brew.sh, then run: brew install ffmpeg. ${FFMPEG_HELP}`;
  if (platform === 'win32')
    return `Install winget from https://learn.microsoft.com/windows/package-manager/winget/, then run: winget install --id Gyan.FFmpeg -e --source winget. ${FFMPEG_HELP}`;
  if (platform === 'linux')
    return `Install ffmpeg with your distro package manager: sudo apt install ffmpeg; sudo dnf install ffmpeg; or sudo pacman -S ffmpeg. ${FFMPEG_HELP}`;
  return `Install ffmpeg with your platform's package manager. ${FFMPEG_HELP}`;
}

async function executable(path: string, platform: NodeJS.Platform) {
  try {
    await access(path, platform === 'win32' ? constants.F_OK : constants.X_OK);
    return (await stat(path)).isFile();
  } catch {
    return false;
  }
}

export async function resolveFfmpeg({
  path,
  env = process.env,
  platform = process.platform,
  prompts,
}: {
  path?: string;
  env?: NodeJS.ProcessEnv;
  platform?: NodeJS.Platform;
  prompts?: Pick<NonNullable<Ui['prompts']>, 'confirm'>;
} = {}) {
  const paths = platform === 'win32' ? win32 : posix;
  const extensions =
    platform === 'win32'
      ? (env.PATHEXT ?? '.EXE;.CMD;.BAT;.COM').split(';')
      : [''];

  async function onPath(name: string) {
    for (const folder of env.PATH?.split(paths.delimiter) ?? []) {
      if (!folder) continue;
      for (const extension of extensions) {
        const candidate = paths.resolve(folder, `${name}${extension}`);
        if (await executable(candidate, platform)) return candidate;
      }
    }
  }

  async function find() {
    for (const candidate of [path, env.CODEIMAGE_FFMPEG]) {
      if (candidate && (await executable(candidate, platform)))
        return paths.resolve(candidate);
    }
    const found = await onPath('ffmpeg');
    if (found) return found;
    if (platform === 'win32' && env.LOCALAPPDATA) {
      const linked = paths.join(
        env.LOCALAPPDATA,
        'Microsoft',
        'WinGet',
        'Links',
        'ffmpeg.exe',
      );
      if (await executable(linked, platform)) return linked;
    }
  }

  let found = await find();
  if (!found) {
    const instructions = installInstructions(platform);
    const missing = new UsageError(
      `ffmpeg is required for MP4 export. ${instructions}`,
    );
    if (!prompts || env.CI || (platform !== 'darwin' && platform !== 'win32'))
      throw missing;
    const command = platform === 'darwin' ? 'brew' : 'winget';
    const installer = await onPath(command);
    if (!installer) throw missing;
    const args =
      platform === 'darwin'
        ? ['install', 'ffmpeg']
        : ['install', '--id', 'Gyan.FFmpeg', '-e', '--source', 'winget'];
    if (
      !(await prompts.confirm(
        `ffmpeg is required for MP4. Run ${command} ${args.join(' ')}?`,
      ))
    )
      throw missing;
    try {
      const child = spawn(installer, args, {stdio: 'inherit', env});
      const untrack = trackEncoder(child);
      try {
        await new Promise<void>((resolve, reject) => {
          child.once('error', reject);
          child.once('close', code =>
            code === 0
              ? resolve()
              : reject(new Error(`${command} exited ${code}`)),
          );
        });
      } finally {
        untrack();
      }
    } catch (cause) {
      throw new UsageError(
        `Could not install ffmpeg: ${cause instanceof Error ? cause.message : String(cause)}. ${instructions}`,
        {cause},
      );
    }
    found = await find();
    if (!found)
      throw new UsageError(
        `ffmpeg is still unavailable. Restart your terminal or pass --ffmpeg <path>. ${instructions}`,
      );
  }

  const child = spawn(found, ['-hide_banner', '-encoders'], {
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
    env,
  });
  const untrack = trackEncoder(child);
  let encoders = '';
  child.stdout.on('data', chunk => {
    encoders += String(chunk);
  });
  child.stderr.on('data', chunk => {
    encoders += String(chunk);
  });
  try {
    await new Promise<void>((resolve, reject) => {
      child.once('error', reject);
      child.once('close', code =>
        code === 0 ? resolve() : reject(new Error(`ffmpeg exited ${code}`)),
      );
    });
    if (!/^\s*V\S*\s+libx264\s/m.test(encoders))
      throw new Error('the libx264 encoder is not listed');
  } catch (cause) {
    throw new UsageError(
      `Cannot use ffmpeg at ${found}: ${cause instanceof Error ? cause.message : String(cause)}. MP4 requires the libx264 encoder. ${installInstructions(platform)}`,
      {cause},
    );
  } finally {
    untrack();
  }
  return found;
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
