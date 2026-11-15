import assert from 'node:assert/strict';
import {mkdir, readFile, writeFile} from 'node:fs/promises';
import {extname, join} from 'node:path';
import {parseArgs} from 'node:util';
import type {Browser} from 'playwright';
import {PNG} from 'pngjs';
import type {
  SnapshotFont,
  SnapshotMarkup,
} from '../../packages/render/dist/index.mjs';
import {
  renderSnapshot,
  snapshotMarkup,
} from '../../packages/render/dist/index.mjs';
import {
  diffPng,
  launchChrome,
  MAX_DIFF_PERCENT,
  PIXELMATCH_THRESHOLD,
} from './lib';

import {matrix, SCALE} from './takumi-cells';

const {values: args} = parseArgs({
  options: {
    out: {type: 'string', default: '/tmp/codeimage-parity/takumi-vs-chrome'},
    only: {type: 'string'},
  },
});

const webMarksCss = readFile(
  new URL(
    '../../apps/codeimage/src/components/CustomEditor/plugins/lineMarks/marks.css',
    import.meta.url,
  ),
  'utf8',
);

const FONT_FORMATS: Record<string, [mime: string, format: string]> = {
  '.woff2': ['font/woff2', 'woff2'],
  '.ttf': ['font/ttf', 'truetype'],
};

async function fontFace(font: SnapshotFont): Promise<string> {
  const [mime, format] = FONT_FORMATS[extname(font.path)];
  const data = (await readFile(font.path)).toString('base64');
  const ranges = font.unicodeRange
    ?.map(([start, end]) => `U+${start.toString(16)}-${end.toString(16)}`)
    .join(',');
  return [
    '@font-face {',
    `font-family: ${JSON.stringify(font.family)};`,
    `src: url(data:${mime};base64,${data}) format('${format}');`,
    `font-weight: ${font.weight ?? '1 1000'};`,
    ranges ? `unicode-range: ${ranges};` : '',
    '}',
  ].join('');
}

async function renderInChrome(
  browser: Browser,
  markup: SnapshotMarkup,
  output: {width: number; height: number},
): Promise<Buffer> {
  const page = await browser.newPage({viewport: null});
  try {
    const faces = await Promise.all(markup.fonts.map(fontFace));
    // The web app loads marks.css after CodeMirror. Keep this reference independent
    // of the Node renderer's CSS order so clipping regressions remain visible.
    const head = [...faces, ...markup.naturalCss, await webMarksCss]
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
      {width: clip.width * SCALE, height: clip.height * SCALE},
      'Node output must match the natural Chrome client box times scale',
    );
    return await page.screenshot({
      clip,
      omitBackground: true,
      animations: 'disabled',
    });
  } finally {
    await page.close();
  }
}

const slug = (name: string) => name.replace(/[^a-z0-9]+/gi, '-').toLowerCase();

async function main() {
  await mkdir(args.out, {recursive: true});
  const browser = await launchChrome(SCALE);
  const rows: string[] = [];
  let failed = 0;
  try {
    for (const cell of await matrix()) {
      if (args.only && !cell.name.includes(args.only)) continue;
      const markup = await snapshotMarkup(cell.document);
      const takumiBytes = (await renderSnapshot(cell.document)) as Uint8Array;
      const {width, height} = PNG.sync.read(Buffer.from(takumiBytes));
      const chromeBytes = await renderInChrome(browser, markup, {
        width,
        height,
      });
      const base = join(args.out, slug(cell.name));
      await writeFile(`${base}-takumi.png`, takumiBytes);
      await writeFile(`${base}-chrome.png`, chromeBytes);
      const percent = await diffPng(
        `${base}-chrome.png`,
        `${base}-takumi.png`,
        `${base}-diff.png`,
      );
      const pass = percent <= (cell.maxDiffPercent ?? MAX_DIFF_PERCENT);
      if (!pass) failed++;
      rows.push(
        `| ${cell.name} | ${width}x${height} | ${percent.toFixed(2)}% | ${pass ? 'pass' : 'FAIL'} |`,
      );
      console.log(rows.at(-1));
    }
  } finally {
    await browser.close();
  }

  const table = [
    '| Cell | Size | Diff | Result |',
    '| --- | --- | --- | --- |',
    ...rows,
  ].join('\n');
  await writeFile(join(args.out, 'table.md'), `${table}\n`);
  console.log(`\n${table}\n\nImages in ${args.out}`);
  if (failed) {
    console.error(
      `${failed} cell(s) exceed their diff tolerance at threshold ${PIXELMATCH_THRESHOLD}`,
    );
    process.exit(1);
  }
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
