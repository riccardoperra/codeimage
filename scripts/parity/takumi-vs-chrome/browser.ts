import {readFile} from 'node:fs/promises';
import type {
  SnapshotFont,
  SnapshotMarkup,
} from '../../../packages/render/dist/index.mjs';
import {extname} from 'node:path';
import type {Browser} from 'playwright';
import assert from 'node:assert/strict';
export const webMarksCss = readFile(
  new URL(
    '../../../apps/codeimage/src/components/CustomEditor/plugins/lineMarks/marks.css',
    import.meta.url,
  ),
  'utf8',
);
export interface Region {
  x: number;
  y: number;
  width: number;
  height: number;
}
export const FONT_FORMATS: Record<string, [mime: string, format: string]> = {
  '.woff2': ['font/woff2', 'woff2'],
  '.ttf': ['font/ttf', 'truetype'],
};
export async function fontFace(font: SnapshotFont): Promise<string> {
  const [mime, format] = FONT_FORMATS[extname(font.file)];
  const data = Buffer.from(font.data).toString('base64');
  const ranges = font.unicodeRange
    ?.map(([start, end]) => `U+${start.toString(16)}-${end.toString(16)}`)
    .join(',');
  return [
    '@font-face {',
    `font-family: ${JSON.stringify(font.family)};`,
    `src: url(data:${mime};base64,${data}) format('${format}');`,
    `font-weight: ${font.weight ?? '100 900'};`,
    ranges ? `unicode-range: ${ranges};` : '',
    '}',
  ].join('');
}
export async function renderInChrome(
  browser: Browser,
  markup: SnapshotMarkup,
  output: {width: number; height: number},
  checkMarks: boolean,
): Promise<{
  bytes: Buffer;
  crop: Region | null;
  marksStrip: Region | null;
}> {
  const page = await browser.newPage({viewport: null});
  try {
    await page.route('**/*', async route => {
      const source = markup.images.find(
        image => image.src === route.request().url(),
      );
      if (source)
        await route.fulfill({
          contentType: 'image/png',
          body: Buffer.from(new Uint8Array(source.data)),
        });
      else await route.continue();
    });
    const faces = await Promise.all(markup.fonts.map(fontFace));

    const head = [...markup.naturalCss, await webMarksCss, ...faces]
      .map(css => `<style>${css}</style>`)
      .join('');
    await page.setContent(
      markup.html.replace(
        '<html>',
        `<!doctype html><html><head>${head}</head>`,
      ),
    );
    await page.evaluate(() => document.fonts.ready);
    const clip = await page.locator('[data-snapshot-frame]').evaluate(el => {
      const {x, y} = el.getBoundingClientRect();
      return {x, y, width: el.clientWidth, height: el.clientHeight};
    });
    assert.deepEqual(
      output,
      {
        width: clip.width * markup.document.scale,
        height: clip.height * markup.document.scale,
      },
      'Node output must match the natural Chrome client box times scale',
    );
    await page
      .locator('img')
      .evaluateAll((images: HTMLImageElement[]) =>
        Promise.all(images.map(image => image.decode())),
      );
    const mark = page.locator('[data-frame-signature] > div').first();
    const bounds = (await mark.count()) ? await mark.boundingBox() : null;
    const scale = markup.document.scale;
    const crop = bounds
      ? {
          x: Math.max(0, Math.floor((bounds.x - clip.x - 8) * scale)),
          y: Math.max(0, Math.floor((bounds.y - clip.y - 8) * scale)),
          width: Math.ceil((bounds.width + 16) * scale),
          height: Math.ceil((bounds.height + 16) * scale),
        }
      : null;

    const marksStrip = checkMarks
      ? await page
          .locator(
            '[data-line-marks] .cm-lineNumbers :is(.cm-lineMark-added, .cm-lineMark-removed, .cm-lineMark-highlight), ' +
              '[data-line-marks]:not([data-line-numbers="true"]) [data-mark]',
          )
          .evaluateAll(
            (elements, {x, y, scale}) => {
              if (!elements.length) throw new Error('No mark signs to compare');
              const boxes = elements.map(el => {
                const rect = el.getBoundingClientRect();
                const before = getComputedStyle(el, '::before');
                const width = parseFloat(before.width);
                if (!(width > 0) || before.content === 'none') {
                  throw new Error(
                    'Mark inset must have a visible pseudo-element',
                  );
                }
                return {
                  left: rect.left - width,
                  right: rect.left,
                  top: rect.top,
                  bottom: rect.bottom,
                };
              });
              const left = Math.floor(
                (Math.min(...boxes.map(b => b.left)) - x) * scale,
              );
              const top = Math.floor(
                (Math.min(...boxes.map(b => b.top)) - y) * scale,
              );
              const right = Math.ceil(
                (Math.max(...boxes.map(b => b.right)) - x) * scale,
              );
              const bottom = Math.ceil(
                (Math.max(...boxes.map(b => b.bottom)) - y) * scale,
              );
              return {
                x: left,
                y: top,
                width: right - left,
                height: bottom - top,
              };
            },
            {...clip, scale},
          )
      : null;
    return {
      crop,
      marksStrip,
      bytes: await page.screenshot({
        clip,
        omitBackground: true,
        animations: 'disabled',
      }),
    };
  } finally {
    await page.close();
  }
}
