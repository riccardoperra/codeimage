import {spawn} from 'node:child_process';
import {constants} from 'node:fs';
import {access, stat} from 'node:fs/promises';

import {posix, win32} from 'node:path';

import {UsageError} from '../errors';
import type {Ui} from '../ui';
import {trackEncoder} from './lifecycle';
import {FFMPEG_HELP, installInstructions} from './ffmpegHelp';
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
  warn,
}: {
  path?: string;
  warn?: (message: string) => void;
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

  let warned = false;
  async function find() {
    if (path) {
      if (await executable(path, platform)) return paths.resolve(path);
      throw new UsageError(
        `--ffmpeg: ${path} is not an executable file. ${FFMPEG_HELP}`,
      );
    }
    const fromEnv = env.CODEIMAGE_FFMPEG;
    if (fromEnv) {
      if (await executable(fromEnv, platform)) return paths.resolve(fromEnv);
      if (!warned) {
        warned = true;
        warn?.(
          `CODEIMAGE_FFMPEG: ${fromEnv} is not an executable file; looking for ffmpeg on PATH`,
        );
      }
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
    if (!canInstall(platform, env) || !prompts) throw missing;
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

function canInstall(platform: NodeJS.Platform, env: NodeJS.ProcessEnv) {
  return !env.CI && (platform === 'darwin' || platform === 'win32');
}
