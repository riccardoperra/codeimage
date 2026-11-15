import {test} from 'vitest';
import assert from 'node:assert/strict';
import {mkdtemp, readdir, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {SUPPORTED_FONTS} from '../../../apps/codeimage/src/core/configuration/font.ts';
import {buildFonts, coverage, parseUnicodeRange} from '../build-fonts.mjs';

test('catalog covers the app, preserves weights, and bundles only Inter/JB', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'codeimage-manifest-'));
  try {
    const catalog = await buildFonts(SUPPORTED_FONTS, dir);
    assert.deepEqual(
      catalog.fonts
        .filter(font => font.role === 'code')
        .map(font => font.id)
        .sort(),
      SUPPORTED_FONTS.map(font => font.id).sort(),
    );
    const bundled = catalog.fonts.filter(font =>
      font.files.some(file => !file.url),
    );
    assert.deepEqual(bundled.map(font => font.id).sort(), [
      'jetbrains-mono',
      'signature',
      'ui',
    ]);
    assert.ok(
      bundled
        .flatMap(font => font.files)
        .reduce((sum, file) => sum + file.bytes, 0) < 1_000_000,
    );
    assert.deepEqual(
      [
        ...new Set(
          catalog.fonts
            .find(font => font.id === 'ibm-plex-mono')
            .files.map(file => file.weight),
        ),
      ],
      [400, 500, 600],
    );
    const emoji = catalog.fonts.find(font => font.id === 'twemoji');
    assert.ok(
      !emoji.files[0].unicodeRange.some(
        ([start, end]) => start <= 0x4f60 && end >= 0x4f60,
      ),
    );
    assert.equal(
      (await readdir(dir)).filter(file => /\.(ttf|woff2)$/.test(file)).length,
      9,
    );
    assert.deepEqual(parseUnicodeRange('U+4??, U+2000-206f'), [
      [0x400, 0x4ff],
      [0x2000, 0x206f],
    ]);
    assert.equal(typeof coverage, 'function');
  } finally {
    await rm(dir, {recursive: true, force: true});
  }
});
