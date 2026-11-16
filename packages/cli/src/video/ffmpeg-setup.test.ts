import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {ChildProcess, spawn} from 'node:child_process';
import {PassThrough} from 'node:stream';
import {win32} from 'node:path';
import type * as FsPromises from 'node:fs/promises';
import type * as ChildProcesses from 'node:child_process';
import {createUi} from '../ui';
import {describeError} from '../errors';
import {resolveFfmpeg} from './ffmpeg';

const state = vi.hoisted(() => ({
  confirm: vi.fn(),
  cancel: Symbol('cancel'),
  files: new Set<string>(),
  listing: ' V....D libx264 H.264 encoder\n',
  probeExit: 0,
  installerExit: 0,
  spawnError: false,
  install: () => {},
}));
vi.mock('node:fs/promises', async original => ({
  ...(await original<typeof FsPromises>()),
  access: vi.fn(async (path: unknown) => {
    if (!state.files.has(String(path))) throw new Error('ENOENT');
  }),
  stat: vi.fn(async () => ({isFile: () => true})),
}));
vi.mock('node:child_process', async original => ({
  ...(await original<typeof ChildProcesses>()),
  spawn: vi.fn((_command: string, args: string[]) => {
    const child = new ChildProcess();
    const stdout = new PassThrough();
    child.stdout = stdout;
    child.stderr = new PassThrough();
    queueMicrotask(() => {
      if (state.spawnError) {
        child.emit('error', new Error('spawn ENOENT'));
      } else if (args[0] === '-hide_banner') {
        stdout.write(state.listing);
        child.emit('close', state.probeExit, null);
      } else {
        state.install();
        child.emit('close', state.installerExit, null);
      }
    });
    return child;
  }),
}));
vi.mock('@clack/prompts', () => ({
  confirm: state.confirm,
  isCancel: (value: unknown) => value === state.cancel,
  log: {},
  multiselect: vi.fn(),
  spinner: vi.fn(),
}));

const streams = [process.stdin, process.stdout, process.stderr];
const descriptors = streams.map(stream =>
  Object.getOwnPropertyDescriptor(stream, 'isTTY'),
);
function tty(value: boolean) {
  for (const stream of streams)
    Object.defineProperty(stream, 'isTTY', {value, configurable: true});
}
beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv('CI', '');
  vi.stubEnv('TERM', 'xterm');
  tty(true);
  state.files.clear();
  state.listing = ' V....D libx264 H.264 encoder\n';
  state.probeExit = state.installerExit = 0;
  state.spawnError = false;
  state.install = () => {};
  state.confirm.mockResolvedValue(true);
});
afterEach(() => {
  vi.unstubAllEnvs();
  for (const [index, stream] of streams.entries()) {
    const descriptor = descriptors[index];
    if (descriptor) Object.defineProperty(stream, 'isTTY', descriptor);
    else Reflect.deleteProperty(stream, 'isTTY');
  }
});

const env = {PATH: '/tools'};
const darwin = () =>
  ({env, platform: 'darwin', prompts: createUi().prompts}) satisfies Parameters<
    typeof resolveFfmpeg
  >[0];

describe('ffmpeg prerequisite', () => {
  it('checks the selected executable for libx264 before returning it', async () => {
    state.files.add('/tools/ffmpeg');
    expect(await resolveFfmpeg({env, platform: 'linux'})).toBe('/tools/ffmpeg');
    expect(spawn).toHaveBeenCalledExactlyOnceWith(
      '/tools/ffmpeg',
      ['-hide_banner', '-encoders'],
      expect.objectContaining({env, stdio: ['ignore', 'pipe', 'pipe']}),
    );
  });

  it('rejects libx264rgb alone and reports a clear missing-encoder error', async () => {
    state.files.add('/tools/ffmpeg');
    state.listing = ' V....D libx264rgb H.264 encoder\n';
    await expect(resolveFfmpeg({env})).rejects.toThrow(
      /MP4 requires the libx264 encoder/,
    );
  });

  it.each(['nonzero exit', 'spawn failure'])(
    'reports an encoder-list %s',
    async failure => {
      state.files.add('/tools/ffmpeg');
      state.probeExit = failure === 'nonzero exit' ? 1 : 0;
      state.spawnError = failure === 'spawn failure';
      await expect(resolveFfmpeg({env})).rejects.toThrow(
        /Cannot use ffmpeg.*libx264/,
      );
    },
  );

  it('does not fall through to PATH when the explicit executable lacks libx264', async () => {
    state.files.add('/custom/ffmpeg');
    state.files.add('/tools/ffmpeg');
    state.listing = '';
    await expect(resolveFfmpeg({path: '/custom/ffmpeg', env})).rejects.toThrow(
      '/custom/ffmpeg',
    );
    expect(spawn).toHaveBeenCalledTimes(1);
  });

  it('checks the WinGet Links fallback only after flag, environment and PATH', async () => {
    const linked = 'C:\\Local\\Microsoft\\WinGet\\Links\\ffmpeg.exe';
    const flag = 'C:\\custom\\ffmpeg.exe';
    const fromEnv = 'C:\\env\\ffmpeg.exe';
    const onPath = 'C:\\Tools\\ffmpeg.EXE';
    for (const file of [flag, fromEnv, onPath, linked]) state.files.add(file);
    const env = {PATH: 'C:\\Tools', LOCALAPPDATA: 'C:\\Local'};
    const platform = 'win32';
    expect(
      await resolveFfmpeg({
        platform,
        env: {...env, CODEIMAGE_FFMPEG: fromEnv},
        path: flag,
      }),
    ).toBe(flag);
    expect(
      await resolveFfmpeg({platform, env: {...env, CODEIMAGE_FFMPEG: fromEnv}}),
    ).toBe(fromEnv);
    expect(await resolveFfmpeg({platform, env})).toBe(onPath);
    state.files.delete(onPath);
    expect(await resolveFfmpeg({platform, env})).toBe(linked);
  });

  it('reports an invalid --ffmpeg instead of falling back to PATH', async () => {
    state.files.add('/tools/ffmpeg');
    state.files.add('/tools/brew');
    await expect(
      resolveFfmpeg({...darwin(), path: '/missing/ffmpeg'}),
    ).rejects.toThrow('--ffmpeg: /missing/ffmpeg is not an executable file');
    expect(state.confirm).not.toHaveBeenCalled();
    expect(spawn).not.toHaveBeenCalled();
  });

  it('warns about an invalid CODEIMAGE_FFMPEG and falls back to PATH', async () => {
    state.files.add('/tools/ffmpeg');
    state.files.add('/tools/brew');
    const warn = vi.fn();
    await resolveFfmpeg({
      ...darwin(),
      env: {...env, CODEIMAGE_FFMPEG: '/missing/ffmpeg'},
      warn,
    });
    expect(warn).toHaveBeenCalledExactlyOnceWith(
      'CODEIMAGE_FFMPEG: /missing/ffmpeg is not an executable file; looking for ffmpeg on PATH',
    );
    expect(state.confirm).not.toHaveBeenCalled();
  });

  it('does not check WinGet Links on macOS', async () => {
    state.files.add(
      win32.join('C:\\Local', 'Microsoft', 'WinGet', 'Links', 'ffmpeg.exe'),
    );
    await expect(
      resolveFfmpeg({env: {LOCALAPPDATA: 'C:\\Local'}, platform: 'darwin'}),
    ).rejects.toThrow('ffmpeg is required');
    expect(spawn).not.toHaveBeenCalled();
  });

  it('prompts with clack on a TTY and runs brew with inherited stdio before resolving again', async () => {
    state.files.add('/tools/brew');
    state.install = () => {
      state.files.add('/tools/ffmpeg');
    };
    expect(await resolveFfmpeg(darwin())).toBe('/tools/ffmpeg');
    expect(state.confirm).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.stringContaining('brew install ffmpeg'),
        output: process.stderr,
        initialValue: false,
      }),
    );
    expect(spawn).toHaveBeenNthCalledWith(
      1,
      '/tools/brew',
      ['install', 'ffmpeg'],
      {stdio: 'inherit', env},
    );
    expect(spawn).toHaveBeenCalledTimes(2);
  });

  it('resolves a newly installed Windows binary through WinGet Links without restarting', async () => {
    state.files.add('C:\\Tools\\winget.EXE');
    const linked = 'C:\\Local\\Microsoft\\WinGet\\Links\\ffmpeg.exe';
    state.install = () => {
      state.files.add(linked);
    };
    const env = {PATH: 'C:\\Tools', LOCALAPPDATA: 'C:\\Local'};
    expect(
      await resolveFfmpeg({
        env,
        platform: 'win32',
        prompts: createUi().prompts,
      }),
    ).toBe(linked);
    expect(spawn).toHaveBeenNthCalledWith(
      1,
      'C:\\Tools\\winget.EXE',
      ['install', '--id', 'Gyan.FFmpeg', '-e', '--source', 'winget'],
      {stdio: 'inherit', env},
    );
  });

  it.each([false, state.cancel])(
    'does not install when the user declines or cancels (%s)',
    async answer => {
      state.files.add('/tools/brew');
      state.confirm.mockResolvedValue(answer);
      const error = await resolveFfmpeg(darwin()).catch(error => error);
      expect(describeError(error).exitCode).toBe(2);
      expect(spawn).not.toHaveBeenCalled();
    },
  );

  it.each(['stdin', 'stdout', 'stderr'])(
    'never prompts or installs when %s is not a TTY',
    async stream => {
      state.files.add('/tools/brew');
      Object.defineProperty(
        process[
          stream === 'stdin'
            ? 'stdin'
            : stream === 'stdout'
              ? 'stdout'
              : 'stderr'
        ],
        'isTTY',
        {value: false, configurable: true},
      );
      await expect(resolveFfmpeg(darwin())).rejects.toThrow(
        /brew\.sh.*--ffmpeg.*CODEIMAGE_FFMPEG/,
      );
      expect(state.confirm).not.toHaveBeenCalled();
      expect(spawn).not.toHaveBeenCalled();
    },
  );

  it('never prompts or installs in CI even with a TTY', async () => {
    state.files.add('/tools/brew');
    vi.stubEnv('CI', 'true');
    await expect(
      resolveFfmpeg({...darwin(), env: {...env, CI: 'true'}}),
    ).rejects.toThrow('ffmpeg is required');
    expect(state.confirm).not.toHaveBeenCalled();
    expect(spawn).not.toHaveBeenCalled();
  });

  it('prints distro instructions on Linux without prompting or running sudo', async () => {
    await expect(
      resolveFfmpeg({env, platform: 'linux', prompts: createUi().prompts}),
    ).rejects.toThrow(
      /sudo apt install ffmpeg.*sudo dnf install ffmpeg.*sudo pacman -S ffmpeg.*--ffmpeg/,
    );
    expect(state.confirm).not.toHaveBeenCalled();
    expect(spawn).not.toHaveBeenCalled();
  });

  it.each(['darwin', 'win32'] satisfies NodeJS.Platform[])(
    'does not prompt when the %s package manager is absent',
    async platform => {
      await expect(
        resolveFfmpeg({env, platform, prompts: createUi().prompts}),
      ).rejects.toThrow(
        platform === 'darwin'
          ? 'https://brew.sh'
          : 'winget install --id Gyan.FFmpeg -e --source winget',
      );
      expect(state.confirm).not.toHaveBeenCalled();
      expect(spawn).not.toHaveBeenCalled();
    },
  );

  it('reports package-manager failure with installation instructions', async () => {
    state.files.add('/tools/brew');
    state.installerExit = 1;
    await expect(resolveFfmpeg(darwin())).rejects.toThrow(
      /Could not install ffmpeg.*brew exited 1.*--ffmpeg/,
    );
    expect(spawn).toHaveBeenCalledTimes(1);
  });

  it('explains how to continue if installation succeeds but ffmpeg is still missing', async () => {
    state.files.add('/tools/brew');
    await expect(resolveFfmpeg(darwin())).rejects.toThrow(
      /Restart your terminal or pass --ffmpeg/,
    );
    expect(spawn).toHaveBeenCalledTimes(1);
  });
});
