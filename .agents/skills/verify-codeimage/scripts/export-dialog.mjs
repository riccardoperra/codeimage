import assert from 'node:assert/strict';
import {resolve} from 'node:path';
import {readFile} from 'node:fs/promises';

export async function verifyExportNotification({page, editor, download}) {
  await editor().fill('const exportNotification = true;');
  await download('notification.png');
  const toast = page.getByRole('status').filter({hasText: 'Image exported'});
  await toast.getByRole('button', {name: 'Close notification'}).waitFor();
  await toast.getByRole('button', {name: 'Copy alt text', exact: true}).click();
  await toast.waitFor({state: 'hidden'});
  await page.getByRole('status').filter({hasText: 'Alt text copied'}).waitFor();
  assert.match(
    await page.evaluate(() => navigator.clipboard.readText()),
    /exportNotification/,
  );
}

export async function verifyExportDialog(
  {page, doctor, editor, settings, closeSettings},
  out,
) {
  await doctor();
  const code = 'exportDialogSentinel';
  await editor().fill(`const ${code} = true;`);
  await settings('appearance');
  await page
    .locator('[data-setting="export-style"]')
    .getByRole('tab', {name: 'Dialog', exact: true})
    .click();
  await closeSettings();

  const trigger = page.locator('[data-export-image]');
  const dialog = page.locator('[data-export-sheet]');
  const svg = dialog.getByRole('radio', {name: /^SVG\b/});
  const png = dialog.getByRole('radio', {name: /^PNG\b/});
  const open = async () => {
    await trigger.press('Enter');
    await dialog.waitFor();
  };
  await open();
  const preview = dialog.getByRole('img', {name: 'Image preview'});
  await preview.waitFor();
  await page.waitForFunction(
    image => image.complete && image.naturalWidth > 0,
    await preview.elementHandle(),
  );
  await svg.press('Space');
  assert.ok(await svg.isChecked());
  await page.keyboard.press('Escape');
  await dialog.waitFor({state: 'hidden'});
  await trigger.and(page.locator(':focus')).waitFor();

  const downloadSvg = async name => {
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      dialog.locator('[data-export-action="image"]').click(),
    ]);
    assert.match(download.suggestedFilename(), /\.svg$/);
    const file = resolve(out, name);
    await download.saveAs(file);
    const xml = await readFile(file, 'utf8');
    const svgDocument = await page.evaluate(
      ({xml, code}) => {
        const doc = new DOMParser().parseFromString(xml, 'image/svg+xml');
        return {
          root: doc.documentElement.localName,
          width: Number(doc.documentElement.getAttribute('width')),
          height: Number(doc.documentElement.getAttribute('height')),
          containsCode: doc.documentElement.textContent.includes(code),
        };
      },
      {xml, code},
    );
    assert.equal(svgDocument.root, 'svg');
    assert.ok(svgDocument.width > 0 && svgDocument.height > 0);
    assert.ok(svgDocument.containsCode);
  };

  await open();
  assert.ok(await png.isChecked());
  await svg.press('Space');
  await downloadSvg('dialog-one-off.svg');
  await open();
  assert.ok(await png.isChecked());
  await svg.press('Space');
  const remember = dialog.getByRole('checkbox', {name: 'Remember as default'});
  await remember.press('Space');
  assert.ok(await remember.isChecked());
  await downloadSvg('dialog-remembered.svg');
  await open();
  assert.ok(await svg.isChecked());
}
