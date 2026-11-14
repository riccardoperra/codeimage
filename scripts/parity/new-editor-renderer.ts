import assert from 'node:assert/strict';
import {mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import path from 'node:path';
import {chromium} from 'playwright';
import {PNG} from 'pngjs';
import {createRequire} from 'node:module';

async function main() {
  const out =
    process.env.UI_RENDERER_OUT ?? '/tmp/codeimage-new-editor-renderer';
  const url = process.env.UI_RENDERER_URL ?? 'http://localhost:4403';
  mkdirSync(out, {recursive: true});
  const worker = 'apps/codeimage/public/mockServiceWorker.js';
  const original = readFileSync(worker);
  writeFileSync(
    worker,
    readFileSync('apps/codeimage/node_modules/msw/lib/mockServiceWorker.js'),
  );
  const browser = await chromium.launch({headless: true});
  const context = await browser.newContext({acceptDownloads: true});
  const page = await context.newPage();
  const errors: string[] = [];
  const fallbacks: string[] = [];
  const wasm: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => {
    if (message.text().includes('Takumi export failed'))
      fallbacks.push(message.text());
  });
  page.on('request', request => {
    if (request.url().includes('.wasm')) wasm.push(request.url());
  });
  const rows = [];
  try {
    for (const [layout, param] of [
      ['inspector', '2'],
      ['dock', '3'],
      ['studio', '4'],
    ]) {
      console.log({layout, step: 'open'});
      await page.goto(`${url}/?v=${param}`);
      await page
        .locator(`[data-layout="${layout}"]`)
        .waitFor({timeout: 180000});
      await page
        .locator('[data-static-code-view] .cm-line')
        .first()
        .waitFor({state: 'attached'});
      const close = page.getByRole('button', {name: 'close', exact: true});
      if (await close.isVisible()) await close.click();
      console.log({layout, step: 'settings'});
      await page.locator('[data-settings-trigger]:visible').click();
      await page.locator('[data-settings-section="experiments"]').click();
      const toggle = page.getByRole('switch', {
        name: 'Use Takumi rendering engine',
      });
      assert.equal(await toggle.getAttribute('aria-checked'), 'false');
      const requestsBefore = wasm.length;
      if (layout === 'inspector') assert.equal(requestsBefore, 0);
      console.log({layout, step: 'enable'});
      await toggle.press('Space');
      assert.equal(await toggle.getAttribute('aria-checked'), 'true');
      assert.equal(
        wasm.length,
        requestsBefore,
        'The toggle alone must not load WASM',
      );
      await page.keyboard.press('Escape');
      console.log({layout, step: 'reload'});
      await page.reload();
      await page
        .locator(`[data-layout="${layout}"]`)
        .waitFor({timeout: 180000});
      await page
        .locator('[data-static-code-view] .cm-line')
        .first()
        .waitFor({state: 'attached'});
      await page.locator('[data-settings-trigger]:visible').click();
      await page.locator('[data-settings-section="experiments"]').click();
      assert.equal(
        await toggle.getAttribute('aria-checked'),
        'true',
        'Renderer preference survives reload',
      );
      await page.keyboard.press('Escape');
      await page.evaluate(async () => {
        const {getFrameState} = await import('/src/state/editor/frame.ts');
        getFrameState().setExportTarget('square');
      });
      await page.waitForFunction(() => {
        const node = document
          .querySelector('[data-static-code-view]')
          ?.closest('code')
          ?.closest('[data-fit-window]')?.parentElement;
        const rect = node?.getBoundingClientRect();
        return (
          rect &&
          Math.round(rect.width) === 1080 &&
          Math.round(rect.height) === 1080
        );
      });
      console.log({layout, step: 'export'});
      const download = page.waitForEvent('download');
      await page.locator('[data-export-image]').click();
      const image = await download;
      const imagePath = path.join(out, layout + '.png');
      await image.saveAs(imagePath);
      const png = PNG.sync.read(readFileSync(imagePath));
      assert.equal(png.width, 1080);
      assert.equal(png.height, 1080);
      assert.ok(
        wasm.length > requestsBefore,
        'Export must load the selected Takumi engine',
      );
      await page.locator('[data-settings-trigger]:visible').click();
      await page.locator('[data-settings-section="experiments"]').click();
      await page
        .getByRole('button', {name: 'Restore defaults', exact: true})
        .click();
      assert.equal(await toggle.getAttribute('aria-checked'), 'false');
      await page.keyboard.press('Escape');
      rows.push({
        layout,
        persisted: true,
        width: png.width,
        height: png.height,
        restored: true,
      });
    }
    await page.evaluate(async () => {
      window.setRenderer('takumi');
      const {getRootEditorStore} = await import('/src/state/editor/index.ts');
      getRootEditorStore().actions.addEditor({
        code: 'const second = 2;',
        languageId: 'typescript',
        tab: {tabName: 'second.ts'},
      });
    });
    const archiveDownload = page.waitForEvent('download');
    await page.getByRole('button', {name: 'More ways to export'}).click();
    await page
      .getByRole('menuitem', {name: 'Export one image per tab'})
      .click();
    const archive = await archiveDownload;
    const archivePath = path.join(out, 'tabs.zip');
    await archive.saveAs(archivePath);
    const {unzipSync} = createRequire(
      path.resolve('apps/codeimage/package.json'),
    )('fflate');
    const entries = unzipSync(readFileSync(archivePath));
    assert.equal(Object.keys(entries).length, 2);
    for (const bytes of Object.values(entries)) {
      assert.ok(bytes instanceof Uint8Array);
      const png = PNG.sync.read(Buffer.from(bytes));
      assert.equal(png.width, 1080);
      assert.equal(png.height, 1080);
    }
    assert.deepEqual(errors, []);
    assert.deepEqual(fallbacks, []);
    writeFileSync(
      path.join(out, 'results.json'),
      JSON.stringify(
        {rows, tabs: Object.keys(entries), errors, fallbacks, wasm},
        null,
        2,
      ),
    );
    console.log(JSON.stringify(rows, null, 2));
  } finally {
    writeFileSync(
      path.join(out, 'diagnostics.json'),
      JSON.stringify({rows, errors, fallbacks}, null, 2),
    );
    await page
      .screenshot({path: path.join(out, 'final.png')})
      .catch(() => undefined);
    await browser.close();
    writeFileSync(worker, original);
  }
}

void main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
