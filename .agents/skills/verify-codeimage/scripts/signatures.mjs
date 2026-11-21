import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {PNG} from 'pngjs';

export async function auditSignatures({page, editor, section, download, out}) {
  await section('frame');
  const opener = page.locator('#signature-options');
  const panel = page.getByRole('dialog', {name: 'Signature', exact: true});
  const saved = panel.getByRole('button', {
    name: 'Saved signatures',
    exact: true,
  });
  const saveAsNew = page.getByRole('menuitem', {
    name: 'Save as new',
    exact: true,
  });
  const focused = page.locator(':focus');
  await opener.press('Enter');
  await writeFile(
    resolve(out, 'signature-open.aria.txt'),
    await page.locator('body').ariaSnapshot(),
  );
  await page
    .getByPlaceholder('@handle or profile link', {exact: true})
    .fill('@verification');
  await saved.press('ArrowDown');
  await saveAsNew.and(focused).waitFor();
  await page.keyboard.press('Escape');
  await saveAsNew.waitFor({state: 'hidden'});
  await saved.and(focused).waitFor();
  await page.keyboard.press('Escape');
  await panel.waitFor({state: 'hidden'});
  await opener.and(focused).waitFor();

  await opener.press('Enter');
  await saved.click();
  await saveAsNew.click();
  await page
    .getByRole('textbox', {name: 'Signature name', exact: true})
    .fill('Verification signature');
  await page.getByRole('button', {name: 'Save', exact: true}).click();
  await page.keyboard.press('Escape');
  assert.match(
    await page.locator('[data-frame-signature]').first().innerText(),
    /@verification/,
  );
  PNG.sync.read(await download('signature.png'));
  await page.reload();
  await editor().waitFor();
  await section('frame');
  await opener.click();
  await saved.click();
  await page.getByRole('menuitem', {name: /Verification signature/}).click();
  assert.equal(
    await page
      .getByPlaceholder('@handle or profile link', {exact: true})
      .inputValue(),
    '@verification',
  );
}
