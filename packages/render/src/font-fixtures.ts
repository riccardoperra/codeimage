import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {mkdtemp, mkdir, readFile, rm, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {dirname, join} from 'node:path';
import {afterAll} from 'vitest';
import {fontsDir, loadFontCatalog} from './fontManifest';
import type {CatalogFile, CatalogFont} from './fontManifest';

const require = createRequire(import.meta.url);
export async function sourceBytes(font: CatalogFont, file: CatalogFile) {
  if (!file.url) return readFile(new URL(file.file, fontsDir));
  if (font.source.startsWith('codeimage@'))
    return readFile(
      new URL(
        `../../../apps/codeimage/public/assets/fonts/${decodeURI(new URL(file.url).pathname.split('/assets/fonts/')[1])}`,
        import.meta.url,
      ),
    );
  const pkg = font.source.slice(0, font.source.lastIndexOf('@'));
  const path = new URL(file.url).pathname.split(`${font.source}/`)[1];
  return readFile(join(dirname(require.resolve(`${pkg}/package.json`)), path));
}
export async function fixtureCache() {
  const dir = await mkdtemp(join(tmpdir(), 'codeimage-fonts-'));
  await mkdir(join(dir, 'fonts/sha256'), {recursive: true});
  for (const font of loadFontCatalog().fonts)
    for (const file of font.files) {
      if (!file.url) continue;
      const data = await sourceBytes(font, file);
      if (createHash('sha256').update(data).digest('hex') !== file.sha256)
        throw new Error(`Fixture differs from catalog: ${file.file}`);
      await writeFile(join(dir, 'fonts/sha256', file.sha256), data);
    }
  afterAll(() => rm(dir, {recursive: true, force: true}));
  return dir;
}
