import {createHash, randomUUID} from 'node:crypto';
import {
  lstat,
  mkdir,
  open,
  readFile,
  readdir,
  rename,
  rm,
  unlink,
} from 'node:fs/promises';
import {homedir} from 'node:os';
import {join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {setTimeout as delay} from 'node:timers/promises';
import type {FontLoader} from '@takumi-rs/core';
import {findFont, fontsDir, loadFontCatalog} from './fontManifest';
import type {CatalogFile, CatalogFont, FontManifest} from './fontManifest';

export interface FontCacheOptions {
  cacheDir?: string;
  offline?: boolean;
  signal?: AbortSignal;
  onEvent?: (event: FontEvent) => void;
}
export type FontEvent =
  | {
      type: 'download' | 'downloaded';
      fontId: string;
      label: string;
      file: string;
      bytes: number;
    }
  | {type: 'repaired'; fontId: string; file: string}
  | {type: 'cache-unwritable'; dir: string; message: string};
export interface FontStatus {
  id: string;
  label: string;
  role: CatalogFont['role'];
  source: string;
  state: 'bundled' | 'cached' | 'partial' | 'missing';
  files: number;
  filesLocal: number;
  bytes: number;
  bytesLocal: number;
}
export class FontUnavailableError extends Error {
  constructor(
    readonly fontId: string,
    readonly reason: 'offline' | 'network' | 'integrity',
    detail: string,
    options?: ErrorOptions,
  ) {
    super(
      `${fontId}: ${detail}. Run: codeimage fonts install ${fontId}`,
      options,
    );
  }
}
export class FontFileError extends Error {}
export interface FontCache {
  readonly dir: string;
  list(): Promise<FontStatus[]>;
  install(ids: readonly string[] | 'all'): Promise<FontStatus[]>;
  clean(): Promise<void>;
}
export function cacheRoot(
  env = process.env,
  platform = process.platform,
  home = homedir(),
): string {
  if (env.CODEIMAGE_CACHE_DIR?.trim()) return resolve(env.CODEIMAGE_CACHE_DIR);
  if (platform === 'darwin') return join(home, 'Library/Caches/codeimage');
  if (platform === 'win32')
    return join(env.LOCALAPPDATA || join(home, 'AppData/Local'), 'codeimage');
  return join(env.XDG_CACHE_HOME || join(home, '.cache'), 'codeimage');
}
const hash = (bytes: Uint8Array) =>
  createHash('sha256').update(bytes).digest('hex');
const valid = (bytes: Uint8Array, file: CatalogFile) =>
  bytes.length === file.bytes && hash(bytes) === file.sha256;
const hasCode = (error: unknown, code: string) =>
  error instanceof Error && 'code' in error && error.code === code;
async function cached(path: string, file: CatalogFile) {
  try {
    const bytes = await readFile(path);
    return valid(bytes, file) ? bytes : null;
  } catch (error) {
    if (hasCode(error, 'ENOENT')) return undefined;
    throw error;
  }
}

export function createFontStore(
  options: FontCacheOptions & {
    catalog?: FontManifest;
    fetch?: typeof fetch;
  } = {},
) {
  const catalog = options.catalog ?? loadFontCatalog();
  const dir = resolve(options.cacheDir ?? cacheRoot());
  const managed = join(dir, 'fonts');
  const objects = join(managed, 'sha256');
  const temporary = join(managed, 'tmp');
  const pending = new Map<string, Promise<Buffer>>();
  let unwritable = false;
  let swept = false;
  let active = 0;
  const waiting: (() => void)[] = [];
  const emit = (event: FontEvent) => options.onEvent?.(event);
  const pathOf = (file: CatalogFile) => join(objects, file.sha256);
  async function checkDirectories() {
    for (const path of [managed, objects, temporary]) {
      try {
        if ((await lstat(path)).isSymbolicLink())
          throw new Error(`Refusing font cache symlink: ${path}`);
      } catch (error) {
        if (!hasCode(error, 'ENOENT')) throw error;
      }
    }
  }
  async function directories() {
    await mkdir(dir, {recursive: true});
    for (const path of [managed, objects, temporary]) {
      await mkdir(path, {recursive: true});
      if ((await lstat(path)).isSymbolicLink())
        throw new Error(`Refusing font cache symlink: ${path}`);
    }
  }
  async function sweepParts() {
    if (swept) return;
    swept = true;
    const entries = await readdir(temporary);
    await Promise.all(
      entries
        .filter(name => name.endsWith('.part'))
        .map(async name => {
          const path = join(temporary, name);
          try {
            const entry = await lstat(path);
            if (entry.mtimeMs < Date.now() - 86_400_000)
              await rm(path, {force: true});
          } catch (error) {
            if (!hasCode(error, 'ENOENT')) throw error;
          }
        }),
    );
  }
  async function publish(bytes: Buffer, file: CatalogFile) {
    for (let attempt = 0; attempt < 3; attempt++) {
      let part: string | undefined;
      try {
        await directories();
        await sweepParts();
        part = join(
          temporary,
          `${file.sha256}.${process.pid}.${randomUUID()}.part`,
        );
        const handle = await open(part, 'wx');
        try {
          await handle.writeFile(bytes);
          await handle.sync();
        } finally {
          await handle.close();
        }
        try {
          await rename(part, pathOf(file));
        } catch (error) {
          if (!(await cached(pathOf(file), file))) throw error;
        }
        return;
      } catch (error) {
        if (hasCode(error, 'ENOENT') && attempt < 2) continue;
        if (['EACCES', 'EROFS', 'ENOSPC'].some(code => hasCode(error, code))) {
          if (!unwritable)
            emit({
              type: 'cache-unwritable',
              dir,
              message: `Cannot save font cache; set CODEIMAGE_CACHE_DIR to a writable directory (${String(error)})`,
            });
          unwritable = true;
          return;
        }
        throw error;
      } finally {
        if (part) await rm(part, {force: true});
      }
    }
  }
  async function download(font: CatalogFont, file: CatalogFile, url: string) {
    if (active >= 6) await new Promise<void>(resolve => waiting.push(resolve));
    else active++;
    emit({
      type: 'download',
      fontId: font.id,
      label: font.label,
      file: file.file,
      bytes: file.bytes,
    });
    try {
      for (let attempt = 0; ; attempt++) {
        try {
          const signal = AbortSignal.any([
            AbortSignal.timeout(30_000),
            ...(options.signal ? [options.signal] : []),
          ]);
          const response = await (options.fetch ?? fetch)(url, {signal});
          if (!response.ok) {
            if (response.status < 500 && response.status !== 429)
              throw new FontUnavailableError(
                font.id,
                'network',
                `HTTP ${response.status} from ${file.url}`,
              );
            throw new Error(`HTTP ${response.status}`);
          }
          const reader = response.body?.getReader();
          if (!reader) throw new Error('Empty font response');
          const chunks: Uint8Array[] = [];
          let size = 0;
          try {
            while (true) {
              const {value, done} = await reader.read();
              if (done) break;
              size += value.length;
              if (size > file.bytes)
                throw new FontUnavailableError(
                  font.id,
                  'integrity',
                  `download exceeds pinned size (${file.url})`,
                );
              chunks.push(value);
            }
          } finally {
            await reader.cancel().catch(() => undefined);
          }
          const bytes = Buffer.concat(chunks);
          if (!valid(bytes, file))
            throw new FontUnavailableError(
              font.id,
              'integrity',
              `SHA-256 or size mismatch; nothing cached (${file.url})`,
            );
          await publish(bytes, file);
          emit({
            type: 'downloaded',
            fontId: font.id,
            label: font.label,
            file: file.file,
            bytes: bytes.length,
          });
          return bytes;
        } catch (error) {
          if (error instanceof FontUnavailableError) throw error;
          if (attempt >= 2 || options.signal?.aborted)
            throw new FontUnavailableError(
              font.id,
              'network',
              `download failed (${file.url})`,
              {cause: error},
            );
          await delay(250 * 2 ** attempt, undefined, {signal: options.signal});
        }
      }
    } finally {
      const next = waiting.shift();
      if (next) next();
      else active--;
    }
  }
  async function bytes(font: CatalogFont, file: CatalogFile): Promise<Buffer> {
    if (!file.url) {
      const data = await readFile(new URL(file.file, fontsDir));
      if (!valid(data, file))
        throw new Error(
          `Bundled font ${file.file} is corrupt; reinstall codeimage`,
        );
      return data;
    }
    await checkDirectories();
    const data = await cached(pathOf(file), file);
    if (data) return data;
    if (options.offline)
      throw new FontUnavailableError(
        font.id,
        'offline',
        'not cached and --offline forbids downloading',
      );
    if (data === null) {
      await unlink(pathOf(file)).catch(error => {
        if (!hasCode(error, 'ENOENT')) throw error;
      });
      emit({type: 'repaired', fontId: font.id, file: file.file});
    }
    let acquisition = pending.get(file.sha256);
    if (!acquisition) {
      acquisition = download(font, file, file.url).finally(() =>
        pending.delete(file.sha256),
      );
      pending.set(file.sha256, acquisition);
    }
    return acquisition;
  }
  async function list(): Promise<FontStatus[]> {
    await checkDirectories();
    return Promise.all(
      catalog.fonts.map(async font => {
        const local = await Promise.all(
          font.files.map(
            async file => !file.url || !!(await cached(pathOf(file), file)),
          ),
        );
        const count = local.filter(Boolean).length;
        return {
          id: font.id,
          label: font.label,
          role: font.role,
          source: font.source,
          state: font.files.every(file => !file.url)
            ? 'bundled'
            : count === font.files.length
              ? 'cached'
              : count
                ? 'partial'
                : 'missing',
          files: font.files.length,
          filesLocal: count,
          bytes: font.files.reduce((sum, file) => sum + file.bytes, 0),
          bytesLocal: font.files.reduce(
            (sum, file, index) => sum + (local[index] ? file.bytes : 0),
            0,
          ),
        };
      }),
    );
  }
  async function clean() {
    const trash = join(dir, `fonts-trash-${randomUUID()}`);
    try {
      await rename(managed, trash);
    } catch (error) {
      if (!hasCode(error, 'ENOENT')) throw error;
    }
    let entries: string[];
    try {
      entries = await readdir(dir);
    } catch (error) {
      if (hasCode(error, 'ENOENT')) return;
      throw error;
    }
    await Promise.all(
      entries
        .filter(name => /^fonts-trash-[a-f0-9-]{36}$/.test(name))
        .map(name => rm(join(dir, name), {recursive: true, force: true})),
    );
  }
  function resources(code?: CatalogFont) {
    const selected = catalog.fonts.filter(
      font => font.role !== 'code' || font === code,
    );
    const held = new Map<CatalogFile, Promise<Buffer>>();
    const data = (font: CatalogFont, file: CatalogFile) => {
      let value = held.get(file);
      if (!value) {
        value = bytes(font, file);
        held.set(file, value);
      }
      return value;
    };
    const loaders: FontLoader[] = selected.flatMap(font =>
      font.files.map(file => ({
        key: `${font.family}/${file.sha256}/${file.weight ?? 'variable'}`,
        name: font.family,
        weight: file.weight,
        unicodeRange: file.unicodeRange,
        data: () => data(font, file),
      })),
    );
    return {
      loaders,
      async primary(): Promise<FontLoader | undefined> {
        if (!code) return undefined;
        // Native needs may skip a primary with no matching glyphs; its metrics still affect line boxes.
        const file =
          code.files.find(
            file =>
              /-latin-(?!ext-)/.test(file.file) &&
              (file.weight === undefined || file.weight === 400),
          ) ?? code.files[0];
        return {
          name: code.family,
          data: await data(code, file),
          weight: file.weight,
          unicodeRange: file.unicodeRange,
        };
      },
      async faces() {
        return Promise.all(
          selected.flatMap(font =>
            font.files
              .filter(
                file => held.has(file) || (font.role === 'ui' && !file.url),
              )
              .map(async file => ({
                family: font.family,
                path: file.url
                  ? pathOf(file)
                  : fileURLToPath(new URL(file.file, fontsDir)),
                file: file.file,
                data: await data(font, file),
                weight: file.weight,
                unicodeRange: file.unicodeRange,
              })),
          ),
        );
      },
    };
  }
  return {
    dir,
    catalog,
    resources,
    bytes,
    list,
    clean,
    fallbackFamilies: catalog.fonts
      .filter(font => font.role === 'fallback')
      .map(font => font.family),
    async install(ids: readonly string[] | 'all') {
      const fonts =
        ids === 'all' ? catalog.fonts : ids.map(id => findFont(catalog, id));
      await Promise.all(
        fonts.flatMap(font => font.files.map(file => bytes(font, file))),
      );
      return list();
    },
  };
}
export function openFontCache(options: FontCacheOptions = {}): FontCache {
  return createFontStore(options);
}
