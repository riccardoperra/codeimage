import {readFile, unlink} from 'node:fs/promises';

import {findFont, fontsDir, loadFontCatalog} from './fontManifest';
import type {CatalogFile, CatalogFont, FontManifest} from './fontManifest';

import {valid, cached} from './fontCacheStorage';
import {createCacheStorage} from './fontCacheStorage';
import {createFontDownloader} from './fontDownload';
import {createFontResources} from './fontResources';
import {FontUnavailableError} from './fontCacheTypes';
import type {
  FontCacheOptions,
  FontEvent,
  FontStatus,
  FontCache,
} from './fontCacheTypes';
export {cacheRoot} from './fontCacheStorage';
export {FontUnavailableError, FontFileError} from './fontCacheTypes';
export type {
  FontCacheOptions,
  FontEvent,
  FontStatus,
  FontCache,
} from './fontCacheTypes';
export function createFontStore(
  options: FontCacheOptions & {
    catalog?: FontManifest;
    fetch?: typeof fetch;
  } = {},
) {
  const catalog = options.catalog ?? loadFontCatalog();
  const {dir, pathOf, checkDirectories, publish, clean} =
    createCacheStorage(options);
  const pending = new Map<string, Promise<Buffer>>();
  const emit = (event: FontEvent) => options.onEvent?.(event);
  const download = createFontDownloader(options, publish);
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
        'not cached, and downloads are disabled offline',
      );
    if (data === null) {
      await unlink(pathOf(file)).catch(() => undefined);
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
          state: fontState(font, count),
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
  return {
    dir,
    catalog,
    resources: (code?: CatalogFont) =>
      createFontResources(catalog, bytes, code),
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

function fontState(font: CatalogFont, count: number): FontStatus['state'] {
  if (font.files.every(file => !file.url)) return 'bundled';
  if (count === font.files.length) return 'cached';
  return count ? 'partial' : 'missing';
}
