import type {Browser} from 'playwright';
import assert from 'node:assert/strict';
import {PNG} from 'pngjs';
import {join} from 'node:path';
import {readFile, writeFile} from 'node:fs/promises';
import pixelmatch from 'pixelmatch';
import {MAX_DIFF_PERCENT, PIXELMATCH_THRESHOLD} from '../lib';
export const NEW_EDITOR_SCALE = 3;
export async function checkNewEditorExport(
  browser: Browser,
  url: string,
  out: string,
) {
  const page = await browser.newPage({viewport: null});
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  try {
    await page.goto(`${url}/?v=4`, {waitUntil: 'commit'});
    await page
      .locator('.cm-content[contenteditable="true"]')
      .waitFor({state: 'attached', timeout: 600_000});
    await page
      .locator('[data-theme-list] [data-theme-option]')
      .nth(1)
      .waitFor({state: 'attached', timeout: 60_000})
      .catch(() => assert.fail(`The theme list stayed empty: ${errors}`));
    await page.evaluate(() => document.fonts.ready);
    const copy = page.locator('[data-snapshot-frame]');
    const lines = (root: string) =>
      page
        .locator(`${root} .cm-line`)
        .evaluateAll(lines => lines.map(line => line.textContent).join('\n'));
    assert.equal(
      await lines('[data-snapshot-frame] [data-static-code-view]'),
      await lines('.cm-content[contenteditable="true"]'),
      'The export copy shows the editor code',
    );

    await copy.evaluate(frame => {
      const portal = frame.parentElement?.parentElement;
      if (!portal) throw new Error('The export frame has a portal');
      portal.style.setProperty('opacity', '1', 'important');
      portal.style.setProperty('z-index', '2147483647', 'important');
      portal.dataset.parityPortal = '';
    });
    await page.addStyleTag({
      content: '[data-parity-portal]::after{display:none!important}',
    });
    const preview = PNG.sync.read(await copy.screenshot());
    await copy.evaluate(frame => {
      const portal = frame.parentElement?.parentElement;
      if (!portal) throw new Error('The export frame has a portal');
      portal.style.removeProperty('opacity');
      portal.style.removeProperty('z-index');
      delete portal.dataset.parityPortal;
    });

    const news = page.getByRole('button', {name: "Minimize what's new"});
    await news.waitFor({timeout: 15_000}).then(
      () => news.click(),
      () => undefined,
    );
    const download = page.waitForEvent('download', {timeout: 120_000});
    await page.getByRole('button', {name: 'Export', exact: true}).click();
    const file = join(out, 'new-editor-export.png');
    await (await download).saveAs(file);
    const bytes = await readFile(file);
    assert.ok(bytes.length > 0, `The export downloaded no image: ${errors}`);
    const image = PNG.sync.read(bytes);

    for (const side of ['width', 'height'] as const)
      assert.ok(
        Math.abs(image[side] - preview[side]) <= NEW_EDITOR_SCALE,
        `export ${side} ${image[side]}, export copy ${preview[side]}`,
      );
    const width = Math.min(image.width, preview.width);
    const height = Math.min(image.height, preview.height);
    const crop = (png: PNG) => {
      const cropped = new PNG({width, height});
      PNG.bitblt(png, cropped, 0, 0, width, height, 0, 0);
      return cropped;
    };
    const diff = new PNG({width, height});
    const percent =
      (pixelmatch(
        crop(image).data,
        crop(preview).data,
        diff.data,
        width,
        height,
        {threshold: PIXELMATCH_THRESHOLD},
      ) /
        (width * height)) *
      100;
    await writeFile(
      join(out, 'new-editor-export-diff.png'),
      PNG.sync.write(diff),
    );
    assert.deepEqual(errors, [], 'The new editor threw');
    const row = `| new editor export | ${image.width}x${image.height} | ${percent.toFixed(2)}% | ${percent <= MAX_DIFF_PERCENT ? 'pass' : 'FAIL'} |`;
    console.log(row);
    return row;
  } finally {
    await page.close();
  }
}
