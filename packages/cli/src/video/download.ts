import {createHash, randomUUID} from 'node:crypto';
import {constants, createWriteStream, openSync, writeFileSync} from 'node:fs';
import {access, chmod, mkdir, readFile, rename, rm} from 'node:fs/promises';
import {homedir} from 'node:os';
import {join} from 'node:path';
import {pipeline} from 'node:stream/promises';
import {createGunzip} from 'node:zlib';
import {UsageError} from '../errors';
import {ffmpegAsset, FFMPEG_RELEASE} from './checksums';
import {trackPartial} from './lifecycle';

export const FFMPEG_HELP =
  'Provide ffmpeg with --ffmpeg <path>, CODEIMAGE_FFMPEG, ffmpeg on PATH, or codeimage install-ffmpeg (then cache the CodeImage cache folder).';

export function ffmpegCacheRoot({
  platform = process.platform,
  env = process.env,
  home = homedir(),
}: {platform?: NodeJS.Platform; env?: NodeJS.ProcessEnv; home?: string} = {}) {
  if (platform === 'darwin') return join(home, 'Library', 'Caches');
  if (platform === 'win32')
    return env.LOCALAPPDATA ?? join(home, 'AppData', 'Local');
  return env.XDG_CACHE_HOME ?? join(home, '.cache');
}

export function ffmpegCacheFolder({
  cacheRoot = ffmpegCacheRoot(),
  release = FFMPEG_RELEASE,
  target = `${process.platform}-${process.arch}`,
}: {cacheRoot?: string; release?: string; target?: string} = {}) {
  return join(cacheRoot, 'codeimage', 'ffmpeg', release, target);
}

export const ffmpegBinaryName = (platform = process.platform) =>
  platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg';

async function cachedBinary(
  folder: string,
  binaryName: string,
  platform: NodeJS.Platform,
) {
  const path = join(folder, binaryName);
  try {
    await Promise.all([
      access(path, platform === 'win32' ? constants.F_OK : constants.X_OK),
      readFile(join(folder, 'LICENSE')),
      readFile(join(folder, 'README')),
    ]);
    return path;
  } catch {
    return undefined;
  }
}

export type DownloadOptions = {
  cacheRoot?: string;
  platform?: NodeJS.Platform;
  arch?: NodeJS.Architecture;
  signal?: AbortSignal;
  release?: string;
  baseUrl?: string;
  asset?: ReturnType<typeof ffmpegAsset>;
  stderr?: Pick<NodeJS.WriteStream, 'write' | 'isTTY'>;
};

export async function downloadFfmpeg(
  options: DownloadOptions = {},
): Promise<string> {
  const platform = options.platform ?? process.platform;
  const release = options.release ?? FFMPEG_RELEASE;
  const stderr = options.stderr ?? process.stderr;
  try {
    const asset =
      options.asset ?? ffmpegAsset(platform, options.arch ?? process.arch);
    const folder = ffmpegCacheFolder({
      ...options,
      release,
      target: asset.target,
    });
    const binaryName = ffmpegBinaryName(platform);
    const cached = await cachedBinary(folder, binaryName, platform);
    if (cached) return cached;
    options.signal?.throwIfAborted();
    await mkdir(folder, {recursive: true});
    stderr.write(
      `Downloading ffmpeg ${release} (${(asset.bytes / 1_000_000).toFixed(1)} MB) to ${folder}\n`,
    );
    const baseUrl =
      options.baseUrl ??
      `https://github.com/eugeneware/ffmpeg-static/releases/download/${release}`;
    const suffix = `.${process.pid}.${randomUUID()}.partial`;
    const temporary = [binaryName, 'LICENSE', 'README'].map(name =>
      join(folder, name + suffix),
    );
    const untrack = temporary.map(trackPartial);
    const signal = options.signal
      ? AbortSignal.any([options.signal, AbortSignal.timeout(120_000)])
      : AbortSignal.timeout(120_000);
    const request = async (name: string) => {
      const response = await fetch(`${baseUrl}/${name}`, {signal});
      if (!response.ok || !response.body)
        throw new Error(`${name}: HTTP ${response.status}`);
      return response;
    };
    try {
      const response = await request(asset.name);
      const hash = createHash('sha256');
      let received = 0;
      let progressAt = 0;
      async function* compressed() {
        if (!response.body) throw new Error('Empty ffmpeg download');
        for await (const chunk of response.body) {
          received += chunk.byteLength;
          hash.update(chunk);
          if (stderr.isTTY && Date.now() - progressAt >= 200) {
            stderr.write(
              `\rDownloading ffmpeg: ${Math.min(100, Math.floor((received / asset.bytes) * 100))}%`,
            );
            progressAt = Date.now();
          }
          yield chunk;
        }
      }
      // Open before yielding: a signal cannot unlink before an async open creates the file.
      await pipeline(
        compressed(),
        createGunzip(),
        createWriteStream(temporary[0], {
          fd: openSync(temporary[0], 'wx', 0o700),
        }),
        {signal},
      );
      if (stderr.isTTY) stderr.write('\rDownloading ffmpeg: 100%\n');
      if (hash.digest('hex') !== asset.sha256 || received !== asset.bytes)
        throw new Error('ffmpeg SHA-256 or size mismatch');
      for (const [index, name] of ['LICENSE', 'README'].entries()) {
        const response = await request(`${asset.target}.${name}`);
        const text = await response.text();
        if (!text.trim()) throw new Error(`Empty ffmpeg ${name}`);
        writeFileSync(temporary[index + 1], text, {flag: 'wx'});
      }
      await chmod(temporary[0], 0o755);
      signal.throwIfAborted();
      // Publish the binary last, so a hit always has both licence documents.
      await rename(temporary[1], join(folder, 'LICENSE'));
      await rename(temporary[2], join(folder, 'README'));
      try {
        await rename(temporary[0], join(folder, binaryName));
      } catch (error) {
        // Windows cannot replace an executable another export has started.
        if (!(await cachedBinary(folder, binaryName, platform))) throw error;
      }
      return join(folder, binaryName);
    } finally {
      await Promise.all(temporary.map(path => rm(path, {force: true})));
      for (const release of untrack) release();
    }
  } catch (cause) {
    if (options.signal?.aborted) throw cause;
    throw new UsageError(
      `Cannot install ffmpeg: ${cause instanceof Error ? cause.message : String(cause)}. ${FFMPEG_HELP}`,
    );
  }
}
