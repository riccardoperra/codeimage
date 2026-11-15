import type {PNG} from 'pngjs';
import {describe, expect, it, vi} from 'vitest';
import {countPixels, decode, plainDocument} from './test-utils';

// Each call loads the renderer in a new module graph, as a new process would.
const freshRenderer = async () => {
  vi.resetModules();
  return import('./render');
};

const saturated = (image: PNG) =>
  countPixels(image, (r, g, b) => Math.max(r, g, b) - Math.min(r, g, b) > 150);

describe('fallback fonts', {timeout: 60_000}, () => {
  it('draw a flag in the first render of a process', async () => {
    const {renderSnapshot} = await freshRenderer();
    const draw = async (code: string) =>
      decode(await renderSnapshot(plainDocument(code)));
    expect(saturated(await draw('"xx"'))).toBe(0);
    expect(saturated(await draw('"🇮🇹"'))).toBeGreaterThan(20);
  });

  it('give the same image whatever rendered before', async () => {
    const flag = plainDocument('const it = "🇮🇹";');
    const first = await (await freshRenderer()).renderSnapshot(flag);
    const warmed = await freshRenderer();
    for (const code of ['"🎉"', '"你好"', '"안녕"']) {
      await warmed.renderSnapshot(plainDocument(code));
    }
    await warmed.renderSnapshot(
      plainDocument('"Привет → ✓"', {fontId: 'fira-code'}),
    );
    expect(await warmed.renderSnapshot(flag)).toEqual(first);
  });
});

// The eager side retains P10's CSS ranges and registration order.
describe('lazy font selection', {timeout: 60_000}, () => {
  it('is byte-identical to eager loading across scripts and families', async () => {
    const {Renderer} = await import('@takumi-rs/core');
    const {loadFontCatalog} = await import('./fontManifest');
    const {sourceBytes} = await import('./font-fixtures');
    const {createFontStore} = await import('./fontCache');
    const catalog = loadFontCatalog();
    const store = createFontStore({offline: true});
    const corpus = [
      'const answer = 42;',
      'a → b ✓ …',
      '🎉 🇮🇹 👨‍👩‍👧 1️⃣ ©',
      '你好世界',
      '안녕하세요 漢字',
      'カタカナ',
      'Привет',
    ];
    for (const id of ['jetbrains-mono', 'monaspace-Neon', 'space-mono']) {
      const code = catalog.fonts.find(font => font.id === id);
      if (!code) throw new Error(id);
      const selected = catalog.fonts.filter(
        font => font.role !== 'code' || font === code,
      );
      const eager = new Renderer();
      for (const font of [
        ...selected.filter(font => font.role === 'fallback'),
        ...selected.filter(font => font.role !== 'fallback'),
      ]) {
        for (const file of font.files)
          await eager.registerFont({
            name: font.family,
            data: await sourceBytes(font, file),
            weight: file.weight,
            unicodeRange: file.declaredRange,
          });
      }
      // The second box has no text, like the watermark: its height is the
      // strut of an Inter face nothing else asks for.
      const pages = (text: string) => [
        `<div style="font-family:'${code.family}';font-size:16px;color:black;background:white">${text}<span style="font-family:'Inter var'"> tab.ts ${text}</span></div>`,
        `<div style="font-family:'Inter var';font-size:16px;background:white"><div style="font-family:'${code.family}'">${text}</div><div style="width:24px;background:black"><svg width="8" height="8"></svg></div></div>`,
      ];
      for (const text of corpus) {
        for (const html of pages(text)) {
          const options = {
            width: 800,
            height: 80,
            format: 'png' as const,
            fontFamilies: store.fallbackFamilies,
          };
          const lazy = new Renderer();
          const resources = store.resources(code);
          for (const primary of resources.primaries)
            await lazy.registerFont(primary);
          expect(
            await lazy.render(html, {...options, fonts: resources.loaders}),
            `${id}: ${html}`,
          ).toEqual(await eager.render(html, options));
        }
      }
    }
  });
  it('loads no emoji or CJK for ASCII, and only KR shards for Hangul', async () => {
    const {Renderer} = await import('@takumi-rs/core');
    const {createFontStore} = await import('./fontCache');
    const store = createFontStore({offline: true});
    const code = store.catalog.fonts.find(font => font.id === 'jetbrains-mono');
    for (const text of ['const x = 1;', '안녕하세요']) {
      const resources = store.resources(code);
      await new Renderer().render(
        `<div style="font-family:'${code?.family}'">${text}</div>`,
        {
          width: 400,
          height: 80,
          fonts: resources.loaders,
          fontFamilies: store.fallbackFamilies,
        },
      );
      const fallbackFiles = (await resources.faces()).filter(
        face => face.family.startsWith('Noto') || face.family === 'Twemoji',
      );
      if (text.startsWith('const')) expect(fallbackFiles).toEqual([]);
      else {
        expect(fallbackFiles.length).toBeGreaterThan(0);
        expect(fallbackFiles.length).toBeLessThan(5);
        expect(
          fallbackFiles.every(face => face.family === 'Noto Sans KR'),
        ).toBe(true);
      }
    }
  });
  it('keeps only Inter and JetBrains in the built payload, below 1 MB', async () => {
    const {loadFontCatalog, fontsDir} = await import('./fontManifest');
    const {readdir} = await import('node:fs/promises');
    const bundled = loadFontCatalog().fonts.flatMap(font =>
      font.files.filter(file => !file.url),
    );
    expect(bundled.reduce((sum, file) => sum + file.bytes, 0)).toBeLessThan(
      1_000_000,
    );
    expect(
      (await readdir(fontsDir))
        .filter(file => /\.(ttf|woff2)$/.test(file))
        .sort(),
    ).toEqual(bundled.map(file => file.file).sort());
    expect(
      bundled.every(file => /^(Inter|inter-|jetbrains-)/.test(file.file)),
    ).toBe(true);
  });
});
