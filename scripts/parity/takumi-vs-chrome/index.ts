import {parseArgs} from 'node:util';
import {mkdir, writeFile} from 'node:fs/promises';
import {
  diffPng,
  launchChrome,
  MAX_DIFF_PERCENT,
  PIXELMATCH_THRESHOLD,
  serveFixtureImages,
} from '../lib';
import {matrix, MAX_MARKS_DIFF_PERCENT, SCALE} from '../takumi-cells/index';
import {
  renderSnapshot,
  snapshotMarkup,
} from '../../../packages/render/dist/index.mjs';
import {PNG} from 'pngjs';
import {join} from 'node:path';
import pixelmatch from 'pixelmatch';
import {renderInChrome} from './browser';
import {cropPng} from './crop';
export const {values: args} = parseArgs({
  options: {
    out: {type: 'string', default: '/tmp/codeimage-parity/takumi-vs-chrome'},
    only: {type: 'string'},
  },
});
export const slug = (name: string) =>
  name.replace(/[^a-z0-9]+/gi, '-').toLowerCase();
export async function main() {
  await mkdir(args.out, {recursive: true});
  const fixtures = await serveFixtureImages();
  const fixtureUrl = fixtures.url;
  const browsers = await Promise.all([launchChrome(1), launchChrome(SCALE)]);
  const originalFetch = globalThis.fetch;
  const rows: string[] = [];
  let failed = 0;
  try {
    for (const cell of await matrix(fixtureUrl)) {
      if (args.only && !cell.name.includes(args.only)) continue;
      globalThis.fetch = (input, init) => {
        if (
          String(input).startsWith('https://avatars.githubusercontent.com/')
        ) {
          if (cell.avatar === 'offline')
            return Promise.reject(new TypeError('offline fixture'));
          return originalFetch(`${fixtureUrl}/avatar.png`, init);
        }
        return originalFetch(input, init);
      };
      const markup = await snapshotMarkup(cell.document);
      const takumiBytes = (await renderSnapshot(cell.document)) as Uint8Array;
      const {width, height} = PNG.sync.read(Buffer.from(takumiBytes));
      const {
        bytes: chromeBytes,
        crop,
        marksStrip,
      } = await renderInChrome(
        browsers[markup.document.scale === 1 ? 0 : 1],
        markup,
        {width, height},
        cell.checkMarks ?? false,
      );
      const base = join(args.out, slug(cell.name));
      await writeFile(`${base}.json`, JSON.stringify(cell.document, null, 2));
      await writeFile(`${base}-takumi.png`, takumiBytes);
      await writeFile(`${base}-chrome.png`, chromeBytes);
      const percent = await diffPng(
        `${base}-chrome.png`,
        `${base}-takumi.png`,
        `${base}-diff.png`,
      );
      let cropPercent: number | null = null;
      if (crop) {
        const chrome = PNG.sync.read(chromeBytes);
        const takumi = PNG.sync.read(Buffer.from(takumiBytes));
        const width = Math.min(crop.width, chrome.width - crop.x);
        const height = Math.min(crop.height, chrome.height - crop.y);
        const extract = (image: PNG) => {
          const out = new PNG({width, height});
          PNG.bitblt(image, out, crop.x, crop.y, width, height, 0, 0);
          return out;
        };
        const reference = extract(chrome);
        const actual = extract(takumi);
        const diff = new PNG({width, height});
        cropPercent =
          (pixelmatch(reference.data, actual.data, diff.data, width, height, {
            threshold: PIXELMATCH_THRESHOLD,
          }) /
            (width * height)) *
          100;
        await writeFile(`${base}-signature-diff.png`, PNG.sync.write(diff));
      }
      let marksPercent: number | null = null;
      if (marksStrip) {
        await Promise.all([
          writeFile(
            `${base}-marks-chrome.png`,
            cropPng(chromeBytes, marksStrip),
          ),
          writeFile(
            `${base}-marks-takumi.png`,
            cropPng(takumiBytes, marksStrip),
          ),
        ]);
        marksPercent = await diffPng(
          `${base}-marks-chrome.png`,
          `${base}-marks-takumi.png`,
          `${base}-marks-diff.png`,
        );
      }
      const pass =
        percent <= MAX_DIFF_PERCENT &&
        (cropPercent === null || cropPercent <= MAX_DIFF_PERCENT) &&
        (marksPercent === null || marksPercent <= MAX_MARKS_DIFF_PERCENT);
      if (!pass) failed++;
      rows.push(
        `| ${cell.name} | ${width}x${height} | ${percent.toFixed(2)}% | ${cropPercent === null ? '-' : `${cropPercent.toFixed(2)}%`} | ${marksPercent === null ? '-' : `${marksPercent.toFixed(3)}%`} | ${pass ? 'pass' : 'FAIL'} |`,
      );
      console.log(rows.at(-1));
    }
  } finally {
    globalThis.fetch = originalFetch;
    await Promise.all(browsers.map(browser => browser.close()));
    await fixtures.close();
  }

  const table = [
    '| Cell | Size | Diff | Signature crop | Marks strip | Result |',
    '| --- | --- | --- | --- | --- | --- |',
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
