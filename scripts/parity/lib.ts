import assert from 'node:assert/strict';
import {readFile, writeFile} from 'node:fs/promises';
import {createServer} from 'node:http';
import pixelmatch from 'pixelmatch';
import type {Page} from 'playwright';
import {chromium} from 'playwright';
import {PNG} from 'pngjs';

export const PIXELMATCH_THRESHOLD = 0.1;
export const MAX_DIFF_PERCENT = 0.5;

// Chrome at a real device scale, like a HiDPI screen. An emulated
// deviceScaleFactor snaps text baselines to whole CSS pixels instead. Open
// pages with `viewport: null`, since Playwright's default viewport emulates a
// scale of 1 again.
export function launchChrome(scale: number) {
  return chromium.launch({
    args: [
      `--force-device-scale-factor=${scale}`,
      '--window-size=4000,4000',
      // Linux hinting snaps glyph advances to device pixels instead of using
      // the fractional font metrics Takumi and macOS Chrome use.
      '--font-render-hinting=none',
    ],
  });
}

export async function openEditor(page: Page, url: string) {
  console.log(`Opening ${url}`);
  await page.goto(url, {waitUntil: 'commit'});
  await page
    .locator('.cm-content[contenteditable="true"]')
    .waitFor({state: 'attached', timeout: 600_000});
  const close = page.getByRole('button', {name: 'close', exact: true});
  if (await close.isVisible()) await close.click();
  await page.setViewportSize({width: 1441, height: 1000});
  await page.setViewportSize({width: 1440, height: 1000});
  await page.evaluate(() => document.fonts.ready);
}

export async function selectTheme(page: Page, label: string) {
  await page.locator('button[aria-label="Syntax highlight"]').click();
  await page.getByRole('option', {name: label, exact: true}).click();
}

export async function exportPng(page: Page, path: string) {
  await page.getByRole('button', {name: 'Export', exact: true}).click();
  await page.getByRole('tab', {name: 'PNG', exact: true}).click();
  const download = page.waitForEvent('download', {timeout: 120_000});
  await page
    .getByRole('button', {name: 'Confirm', exact: true})
    .click({timeout: 120_000});
  await (await download).saveAs(path);
  const png = PNG.sync.read(await readFile(path));
  assert.ok(png.width > 0 && png.height > 0, 'exported a nonempty image');
  return png;
}

export async function diffPng(
  basePath: string,
  headPath: string,
  diffPath: string,
) {
  const base = PNG.sync.read(await readFile(basePath));
  const head = PNG.sync.read(await readFile(headPath));
  assert.equal(head.width, base.width, `width differs for ${headPath}`);
  assert.equal(head.height, base.height, `height differs for ${headPath}`);
  const diff = new PNG({width: base.width, height: base.height});
  const pixels = pixelmatch(
    base.data,
    head.data,
    diff.data,
    base.width,
    base.height,
    {threshold: PIXELMATCH_THRESHOLD},
  );
  await writeFile(diffPath, PNG.sync.write(diff));
  return (pixels / (base.width * base.height)) * 100;
}

// Solid 192px PNGs on a local port, light when the path says so. Both the
// renderer and a web page (CORS) can load them, so no cell needs the network.
export async function serveFixtureImages() {
  const fixture = new PNG({width: 192, height: 192});
  const bytes = (light: boolean) => {
    for (let i = 0; i < fixture.data.length; i += 4) {
      fixture.data[i] = light ? 245 : 20;
      fixture.data[i + 1] = light ? 245 : 40;
      fixture.data[i + 2] = light ? 245 : 60;
      fixture.data[i + 3] = 255;
    }
    return PNG.sync.write(fixture);
  };
  const server = createServer((request, response) => {
    response.setHeader('Content-Type', 'image/png');
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.end(bytes(request.url?.includes('light') ?? false));
  });
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  assert.ok(address && typeof address !== 'string');
  return {
    url: `http://127.0.0.1:${address.port}`,
    close: () =>
      new Promise<void>((resolve, reject) =>
        server.close(error => (error ? reject(error) : resolve())),
      ),
  };
}
