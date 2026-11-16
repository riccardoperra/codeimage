import assert from 'node:assert/strict';
import {resolve} from 'node:path';
import {PNG} from 'pngjs';
import {lineNumberVariants, setLineNumbers} from './line-mark-numbers.mjs';
import {lineGeometry, assertPlaced} from './line-mark-geometry.mjs';
import {placement} from './line-mark-tab-order.mjs';

async function copiedImage(page, press) {
  await page.evaluate(() => navigator.clipboard.writeText(''));
  await press();
  for (let attempt = 0; attempt < 240; attempt++) {
    const data = await page.evaluate(async () => {
      const items = await navigator.clipboard.read();
      const item = items.find(item => item.types.includes('image/png'));
      if (!item) return null;
      const bytes = new Uint8Array(
        await (await item.getType('image/png')).arrayBuffer(),
      );
      let binary = '';
      for (const byte of bytes) binary += String.fromCharCode(byte);
      return btoa(binary);
    });
    if (data) return PNG.sync.read(Buffer.from(data, 'base64'));
    await page.waitForTimeout(250);
  }
  throw new Error('no image reached the clipboard');
}

function samePixels(a, b) {
  if (a.width !== b.width || a.height !== b.height) return false;
  return Buffer.compare(a.data, b.data) === 0;
}

export async function verifyLineMarkExportClean({page, editor, out, download}) {
  const results = {};
  for (const [numbers, on] of lineNumberVariants) {
    await setLineNumbers(page, on);
    results[numbers] = await exportClean({
      page,
      editor,
      out,
      download,
      numbers,
    });
  }
  return results;
}

async function exportClean({page, editor, out, download, numbers}) {
  await editor.fill(
    ['const one = 1;', 'const two = 2;', 'const three = 3;'].join('\n'),
  );
  await editor.press('ControlOrMeta+Home');
  await editor.press('ControlOrMeta+Alt+1');
  await editor.locator('[data-mark="highlight"]').waitFor();
  await page.locator('[data-export-image]').hover();
  await page
    .locator('.cm-lineMarkToolbar')
    .waitFor({state: 'detached'})
    .catch(() => {});
  const clean = PNG.sync.read(
    await download(`line-mark-export-clean-${numbers}.png`),
  );
  await editor.click();
  await editor.press('ControlOrMeta+Home');
  await editor.press('Shift+ArrowDown');
  const toolbar = page.getByRole('toolbar', {name: 'Line marks', exact: true});
  await toolbar.waitFor();
  const marker = page.locator('.cm-lineMarkMarker[data-active]');
  await marker.waitFor();
  assert.equal(
    await marker.evaluate(element => getComputedStyle(element).opacity),
    '1',
  );
  assertPlaced(
    await lineGeometry(
      page,
      Number(await marker.getAttribute('data-mark-line')),
    ),
    `${numbers}: export marker`,
  );
  await page.screenshot({
    path: resolve(out, `line-mark-export-visible-${numbers}.png`),
  });
  const [pending] = await Promise.all([
    page.waitForEvent('download', {timeout: 60000}),
    page.keyboard.press('ControlOrMeta+s'),
  ]);
  const file = resolve(out, `line-mark-export-with-popups-${numbers}.png`);
  await pending.saveAs(file);
  const {readFile} = await import('node:fs/promises');
  const withPopups = PNG.sync.read(await readFile(file));
  assert.equal(
    samePixels(clean, withPopups),
    true,
    'the export with marker and toolbar on screen matches the clean export',
  );
  const copyKey = process.platform === 'darwin' ? 'Meta+Shift+c' : 'Control+c';
  await page.locator('[data-export-image]').focus();
  const cleanCopy = await copiedImage(page, () => page.keyboard.press(copyKey));
  if (process.platform === 'darwin') {
    await editor.click();
    await editor.press('ControlOrMeta+Home');
    await editor.press('Shift+ArrowDown');
    await toolbar.waitFor();
  } else {
    await editor.locator('.cm-line').first().hover();
    await page.locator('.cm-lineMarkMarker[data-mark-line="1"]').click();
    await page.getByRole('menu', {name: 'Line marks', exact: true}).waitFor();
  }
  await page.screenshot({
    path: resolve(out, `line-mark-copy-visible-${numbers}.png`),
  });
  const popupCopy = await copiedImage(page, () => page.keyboard.press(copyKey));
  assert.equal(
    samePixels(cleanCopy, popupCopy),
    true,
    'the copied image with the line mark popups on screen matches the clean copy',
  );
  await editor.locator('.cm-line').first().hover();
  await page.locator('.cm-lineMarkMarker[data-mark-line="1"]').click();
  await page.getByRole('menu', {name: 'Line marks', exact: true}).waitFor();
  const placed = await placement(page);
  assert.ok(placed.length >= 2);
  assert.ok(placed.every(element => !element.inExport));
  await page.keyboard.press('Escape');
  await editor.press('ControlOrMeta+a');
  await editor.press('ControlOrMeta+Alt+0');
  assert.equal(await editor.locator('[data-mark]').count(), 0);
  return {
    size: {width: clean.width, height: clean.height},
    copy: {width: cleanCopy.width, height: cleanCopy.height},
    placed,
  };
}
