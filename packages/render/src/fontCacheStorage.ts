import {createHash, randomUUID} from 'node:crypto';
import {
  lstat,
  mkdir,
  open,
  readFile,
  readdir,
  rename,
  rm,
} from 'node:fs/promises';
import {homedir} from 'node:os';
import {join, resolve} from 'node:path';

import type {CatalogFile} from './fontManifest';

import type {FontCacheOptions, FontEvent} from './fontCacheTypes';
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
export const valid = (bytes: Uint8Array, file: CatalogFile) =>
  bytes.length === file.bytes && hash(bytes) === file.sha256;
export const hasCode = (error: unknown, code: string) =>
  error instanceof Error && 'code' in error && error.code === code;
export async function cached(path: string, file: CatalogFile) {
  try {
    const bytes = await readFile(path);
    return valid(bytes, file) ? bytes : null;
  } catch (error) {
    if (hasCode(error, 'ENOENT')) return undefined;
    throw error;
  }
}

export function createCacheStorage(options: FontCacheOptions) {
  const dir = resolve(options.cacheDir ?? cacheRoot());
  const managed = join(dir, 'fonts');
  const objects = join(managed, 'sha256');
  const temporary = join(managed, 'tmp');
  let unwritable = false;
  let swept = false;
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

  return {dir, pathOf, checkDirectories, publish, clean};
}
