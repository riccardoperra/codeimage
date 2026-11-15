import {createHash} from 'node:crypto';
import {execFile} from 'node:child_process';
import {createServer} from 'node:http';
import {
  mkdtemp,
  mkdir,
  readFile,
  readdir,
  rm,
  writeFile,
  symlink,
  chmod,
  utimes,
} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join, resolve} from 'node:path';
import {promisify} from 'node:util';
import {afterEach, beforeEach, describe, expect, it} from 'vitest';
import type {CatalogFont, FontManifest} from './fontManifest';
import {cacheRoot, createFontStore} from './fontCache';

const data = Buffer.from('verified test font bytes');
const sha256 = createHash('sha256').update(data).digest('hex');
const exec = promisify(execFile);
let dir: string;
let mode: 'ok' | 'bad' | 'cut' | 'slow' = 'ok';
let requests = 0;
let font: CatalogFont;
let catalog: FontManifest;
let close: () => Promise<void>;
beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), 'codeimage-cache-'));
  mode = 'ok';
  requests = 0;
  const server = createServer((_req, res) => {
    requests++;
    if (mode === 'cut') {
      res.write(data.subarray(0, 4));
      res.destroy();
    } else if (mode === 'slow') setTimeout(() => res.end(data), 100);
    else res.end(mode === 'bad' ? Buffer.alloc(data.length) : data);
  });
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
  close = () => new Promise<void>(resolve => server.close(() => resolve()));
  const address = server.address();
  if (!address || typeof address === 'string')
    throw new Error('No server address');
  font = {
    id: 'test',
    family: 'Test',
    label: 'Test',
    role: 'code',
    source: 'test@1.0.0',
    files: [
      {
        file: 'test.ttf',
        bytes: data.length,
        sha256,
        unicodeRange: [[32, 126]],
        url: `http://127.0.0.1:${address.port}/font`,
      },
    ],
  };
  catalog = {schema: 1, fonts: [font]};
});
afterEach(async () => {
  await close();
  await rm(dir, {recursive: true, force: true});
});
const store = (offline = false) =>
  createFontStore({cacheDir: dir, catalog, offline});
const objectPath = () => join(dir, 'fonts/sha256', sha256);

describe('font cache', () => {
  it('uses platform roots and the explicit override', () => {
    expect(cacheRoot({}, 'darwin', '/home/test')).toBe(
      '/home/test/Library/Caches/codeimage',
    );
    expect(cacheRoot({}, 'linux', '/home/test')).toBe(
      '/home/test/.cache/codeimage',
    );
    expect(cacheRoot({XDG_CACHE_HOME: '/cache'}, 'linux', '/home/test')).toBe(
      '/cache/codeimage',
    );
    expect(cacheRoot({LOCALAPPDATA: '/local'}, 'win32', '/home/test')).toBe(
      '/local/codeimage',
    );
    expect(cacheRoot({CODEIMAGE_CACHE_DIR: './custom'}, 'linux')).toBe(
      resolve('custom'),
    );
  });
  it('publishes verified bytes and detects same-length corruption on every hit', async () => {
    const events: string[] = [];
    const cache = createFontStore({
      cacheDir: dir,
      catalog,
      onEvent: event => events.push(event.type),
    });
    await cache.install(['test']);
    await writeFile(objectPath(), Buffer.alloc(data.length));
    expect((await cache.list())[0].state).toBe('missing');
    await cache.install(['test']);
    expect(await readFile(objectPath())).toEqual(data);
    expect(events).toContain('repaired');
    expect(requests).toBe(2);
    await store(true).install(['test']);
    expect(requests).toBe(2);
  });
  it('rejects offline misses without creating the cache or fetching', async () => {
    await expect(store(true).install(['test'])).rejects.toMatchObject({
      reason: 'offline',
    });
    expect(await readdir(dir)).toEqual([]);
    expect(requests).toBe(0);
  });
  it('fails closed on downloaded mismatches', async () => {
    mode = 'bad';
    await expect(store().install(['test'])).rejects.toMatchObject({
      reason: 'integrity',
    });
    expect(await readdir(dir)).toEqual([]);
    expect(requests).toBe(1);
  });
  it('recovers after interrupted responses and ignores a killed writer part file', async () => {
    mode = 'cut';
    const cache = store();
    await expect(cache.install(['test'])).rejects.toMatchObject({
      reason: 'network',
    });
    await mkdir(join(dir, 'fonts/tmp'), {recursive: true});
    await writeFile(join(dir, 'fonts/tmp/crashed.part'), data.subarray(0, 3));
    mode = 'ok';
    await cache.install(['test']);
    expect(await readFile(objectPath())).toEqual(data);
    await cache.clean();
    expect(await readdir(dir)).toEqual([]);
  });
  it('allows four independent processes to publish the same artifact', async () => {
    mode = 'slow';
    const module = new URL('./fontCache.ts', import.meta.url).href;
    const script = `const {createFontStore}=await import(${JSON.stringify(module)}); await createFontStore(${JSON.stringify({cacheDir: dir, catalog})}).install(['test']);`;
    await Promise.all(
      Array.from({length: 4}, () =>
        exec(process.execPath, [
          '--import',
          'tsx',
          '--input-type=module',
          '-e',
          script,
        ]),
      ),
    );
    expect(await readFile(objectPath())).toEqual(data);
    expect(await readdir(join(dir, 'fonts/tmp'))).toEqual([]);
  });
  it('can clean while a download is active and retains unrelated root files', async () => {
    mode = 'slow';
    await writeFile(join(dir, 'keep.txt'), 'keep');
    const cache = store();
    const pending = cache.install(['test']);
    await cache.clean();
    await pending;
    expect(await readFile(objectPath())).toEqual(data);
    await cache.clean();
    await cache.clean();
    expect(await readdir(dir)).toEqual(['keep.txt']);
  });
  it('rejects cache symlinks without writing into their targets', async () => {
    const target = await mkdtemp(join(tmpdir(), 'codeimage-target-'));
    try {
      await mkdir(join(target, 'sha256'));
      await writeFile(
        join(target, 'sha256', sha256),
        Buffer.alloc(data.length),
      );
      await symlink(target, join(dir, 'fonts'));
      await expect(store().install(['test'])).rejects.toThrow();
      expect(await readFile(join(target, 'sha256', sha256))).toEqual(
        Buffer.alloc(data.length),
      );
      await store().clean();
      expect(await readFile(join(target, 'sha256', sha256))).toEqual(
        Buffer.alloc(data.length),
      );
    } finally {
      await rm(target, {recursive: true, force: true});
    }
  });
  it('bounds concurrent downloads and sweeps only old part files', async () => {
    let active = 0;
    let maximum = 0;
    const server = createServer((request, response) => {
      active++;
      maximum = Math.max(maximum, active);
      setTimeout(() => {
        active--;
        response.end(request.url);
      }, 30);
    });
    await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
    try {
      const address = server.address();
      if (!address || typeof address === 'string')
        throw new Error('No server address');
      const files = Array.from({length: 18}, (_, index) => {
        const payload = Buffer.from(`/font-${index}`);
        return {
          ...font.files[0],
          file: `font-${index}.ttf`,
          bytes: payload.length,
          sha256: createHash('sha256').update(payload).digest('hex'),
          url: `http://127.0.0.1:${address.port}/font-${index}`,
        };
      });
      await mkdir(join(dir, 'fonts/tmp'), {recursive: true});
      const old = join(dir, 'fonts/tmp/old.part');
      await writeFile(old, 'partial');
      await utimes(old, new Date(0), new Date(0));
      const cache = createFontStore({
        cacheDir: dir,
        catalog: {schema: 1, fonts: [{...font, files}]},
      });
      await cache.install('all');
      expect(maximum).toBeGreaterThan(1);
      expect(maximum).toBeLessThanOrEqual(6);
      expect(await readdir(join(dir, 'fonts/tmp'))).toEqual([]);
      expect((await cache.list())[0].filesLocal).toBe(18);
    } finally {
      await new Promise<void>(resolve => server.close(() => resolve()));
    }
  });
  it('returns verified bytes when a cache cannot be written', async () => {
    await chmod(dir, 0o500);
    try {
      const events: string[] = [];
      const cache = createFontStore({
        cacheDir: dir,
        catalog,
        onEvent: event => events.push(event.type),
      });
      expect(await cache.bytes(font, font.files[0])).toEqual(data);
      expect(events).toContain('cache-unwritable');
    } finally {
      await chmod(dir, 0o700);
    }
  });
  it('repairs a corrupt copy in a read-only cache for this render', async () => {
    await store().install(['test']);
    await writeFile(objectPath(), Buffer.alloc(3));
    await chmod(join(dir, 'fonts/sha256'), 0o500);
    try {
      const events: string[] = [];
      const cache = createFontStore({
        cacheDir: dir,
        catalog,
        onEvent: event => events.push(event.type),
      });
      expect(await cache.bytes(font, font.files[0])).toEqual(data);
      expect(events).toEqual([
        'repaired',
        'download',
        'cache-unwritable',
        'downloaded',
      ]);
    } finally {
      await chmod(join(dir, 'fonts/sha256'), 0o700);
    }
  });
  it('supports cancellation', async () => {
    mode = 'slow';
    const controller = new AbortController();
    const cache = createFontStore({
      cacheDir: dir,
      catalog,
      signal: controller.signal,
    });
    const pending = cache.install(['test']);
    controller.abort();
    await expect(pending).rejects.toMatchObject({reason: 'network'});
    expect(await readdir(dir)).toEqual([]);
  });
});
