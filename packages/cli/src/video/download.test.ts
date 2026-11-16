import {createServer} from 'node:http';
import {createHash} from 'node:crypto';
import {gzipSync} from 'node:zlib';
import {mkdtemp, readdir, readFile, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {afterEach, beforeEach, describe, expect, it} from 'vitest';
import {downloadFfmpeg, ffmpegCacheRoot, ffmpegCacheFolder} from './download';

const binary = Buffer.from('#!/bin/sh\necho fake-ffmpeg\n');
const compressed = gzipSync(binary);
const asset = {
  name: 'ffmpeg-linux-x64.gz',
  target: 'linux-x64',
  bytes: compressed.length,
  sha256: createHash('sha256').update(compressed).digest('hex'),
};
let folder: string;
let requests: string[];
let bad = false;
let status = 200;
let missingNotice = false;
let slow = false;
const server = createServer((req, res) => {
  requests.push(req.url ?? '');
  res.statusCode = missingNotice && req.url?.endsWith('LICENSE') ? 503 : status;
  if (req.url?.endsWith('.gz')) {
    if (slow) {
      res.write(compressed.subarray(0, 5));
      return;
    }
    res.end(bad ? gzipSync('tampered executable') : compressed);
  } else
    res.end(
      req.url?.endsWith('LICENSE') ? 'GPL-3.0 license' : 'README and sources',
    );
});
let baseUrl: string;
beforeEach(async () => {
  folder = await mkdtemp(join(tmpdir(), 'codeimage-download-'));
  requests = [];
  bad = slow = false;
  status = 200;
  missingNotice = false;
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  if (!address || typeof address === 'string')
    throw new Error('Expected TCP listener');
  baseUrl = `http://127.0.0.1:${address.port}`;
});
afterEach(async () => {
  server.closeAllConnections();
  await new Promise<void>((resolve, reject) =>
    server.close(error => (error ? reject(error) : resolve())),
  );
  await rm(folder, {recursive: true, force: true});
});
const stderr = {write: () => true, isTTY: false};
const options = () => ({
  cacheRoot: folder,
  baseUrl,
  platform: 'linux' as const,
  arch: 'x64' as const,
  asset,
  stderr,
});
const entries = () =>
  readdir(ffmpegCacheFolder({cacheRoot: folder, target: asset.target}));

describe('ffmpeg release cache', () => {
  it('verifies, decompresses and atomically installs the binary and release notices', async () => {
    const path = await downloadFfmpeg(options());
    expect(await readFile(path)).toEqual(binary);
    expect(await entries()).toEqual(['LICENSE', 'README', 'ffmpeg']);
    expect(requests.sort()).toEqual([
      '/ffmpeg-linux-x64.gz',
      '/linux-x64.LICENSE',
      '/linux-x64.README',
    ]);
    expect(await downloadFfmpeg(options())).toBe(path);
    expect(requests).toHaveLength(3);
  });

  it('deletes a wrong hash and names all four ways to provide ffmpeg', async () => {
    bad = true;
    await expect(downloadFfmpeg(options())).rejects.toThrow(
      /SHA-256.*--ffmpeg.*CODEIMAGE_FFMPEG.*PATH.*install-ffmpeg/s,
    );
    expect(await entries()).toEqual([]);
  });

  it('allows concurrent installers with one complete binary and no partial files', async () => {
    const [first, second] = await Promise.all([
      downloadFfmpeg(options()),
      downloadFfmpeg(options()),
    ]);
    expect(first).toBe(second);
    expect(await readFile(first)).toEqual(binary);
    expect(await entries()).toEqual(['LICENSE', 'README', 'ffmpeg']);
  });

  it('does not publish a binary when its license cannot be downloaded', async () => {
    missingNotice = true;
    await expect(downloadFfmpeg(options())).rejects.toThrow('HTTP 503');
    expect(await entries()).toEqual([]);
  });

  it('aborts a streaming download, cleans partials and permits retry', async () => {
    slow = true;
    const controller = new AbortController();
    const pending = downloadFfmpeg({...options(), signal: controller.signal});
    const rejection = expect(pending).rejects.toThrow(/abort/i);
    while (!requests.length)
      await new Promise(resolve => setTimeout(resolve, 5));
    controller.abort();
    await rejection;
    expect(await entries()).toEqual([]);
    slow = false;
    expect(await readFile(await downloadFfmpeg(options()))).toEqual(binary);
  });

  it('prints size and destination once and uses progress only for TTY stderr', async () => {
    let output = '';
    await downloadFfmpeg({
      ...options(),
      stderr: {
        isTTY: false,
        write: text => {
          output += text;
          return true;
        },
      },
    });
    expect(output).toMatch(
      /Downloading ffmpeg b6.1.1 \([\d.]+ MB\) to .*codeimage\/ffmpeg\/b6.1.1\/linux-x64\n$/,
    );
    expect(output.split('\n')).toHaveLength(2);
    expect(output).not.toContain('\r');
  });

  it('uses the native user cache directory on each OS', () => {
    expect(ffmpegCacheRoot({platform: 'darwin', home: '/home/me'})).toBe(
      '/home/me/Library/Caches',
    );
    expect(
      ffmpegCacheRoot({
        platform: 'linux',
        home: '/home/me',
        env: {XDG_CACHE_HOME: '/xdg'},
      }),
    ).toBe('/xdg');
    expect(
      ffmpegCacheRoot({platform: 'linux', home: '/home/me', env: {}}),
    ).toBe('/home/me/.cache');
    expect(
      ffmpegCacheRoot({platform: 'win32', env: {LOCALAPPDATA: '/local'}}),
    ).toBe('/local');
  });
});
