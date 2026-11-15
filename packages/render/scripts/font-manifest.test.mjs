import {mkdtemp, readdir, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {expect, test} from 'vitest';
import {SUPPORTED_FONTS} from '../../../apps/codeimage/src/core/configuration/font.ts';
import {buildFonts, parseUnicodeRange} from '../build-fonts.mjs';

test('catalog covers the app, preserves weights, and bundles only Inter/JB', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'codeimage-manifest-'));
  try {
    const catalog = await buildFonts(SUPPORTED_FONTS, dir);
    const ids = role =>
      catalog.fonts
        .filter(font => font.role === role)
        .map(font => font.id)
        .sort();
    expect(ids('code')).toEqual(SUPPORTED_FONTS.map(font => font.id).sort());
    const bundled = catalog.fonts.filter(font =>
      font.files.some(file => !file.url),
    );
    expect(bundled.map(font => font.id).sort()).toEqual([
      'jetbrains-mono',
      'signature',
      'ui',
    ]);
    expect(
      bundled
        .flatMap(font => font.files)
        .reduce((sum, file) => sum + file.bytes, 0),
    ).toBeLessThan(1_000_000);
    expect(
      catalog.fonts
        .find(font => font.id === 'ibm-plex-mono')
        .files.map(file => file.weight),
    ).toEqual([400, 500, 600]);
    // Twemoji declares no range; its cmap must not claim CJK, or Noto never loads.
    const [emoji] = catalog.fonts.find(font => font.id === 'twemoji').files;
    expect(
      emoji.unicodeRange.some(
        ([start, end]) => start <= 0x4f60 && end >= 0x4f60,
      ),
    ).toBe(false);
    expect(
      (await readdir(dir)).filter(file => /\.(ttf|woff2)$/.test(file)),
    ).toHaveLength(9);
    expect(parseUnicodeRange('U+4??, U+2000-206f')).toEqual([
      [0x400, 0x4ff],
      [0x2000, 0x206f],
    ]);
  } finally {
    await rm(dir, {recursive: true, force: true});
  }
}, 60_000);
