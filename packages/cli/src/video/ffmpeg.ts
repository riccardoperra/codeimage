import {spawn} from 'node:child_process';

import {rename, rm, stat} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import {tmpdir} from 'node:os';
import {join, resolve} from 'node:path';
import type {RawAnimation} from '@codeimage/render';
import {UsageError} from '../errors';

import {trackEncoder, trackPartial} from './lifecycle';
import {FFMPEG_HELP} from './ffmpegHelp';
import {ffmpegArgs, padFrame} from './ffmpegFrames';
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
