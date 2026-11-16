import assert from 'node:assert/strict';
import {join} from 'node:path';
export async function downloadProject({
  page,
  out,
  scenario,
  requestedFps,
  codes,
}) {
  await page.locator('[data-animate-toggle]').click();
  await page.locator('[data-animate-panel]').waitFor();
  await page.locator('[data-export-menu]').click();
  const action = page.locator('[data-export-action="animation"]');
  if (await action.isVisible()) await action.click();
  const dialog = page.locator('[data-animation-export]');
  await dialog.waitFor();
  const scale = dialog.getByRole('button', {name: /^Scale/});
  if (await scale.count()) {
    await scale.click();
    await page.getByRole('option', {name: '1×', exact: true}).click();
  }
  await dialog.getByRole('button', {name: /^Frame rate/}).click();
  await page
    .getByRole('option', {name: `${requestedFps} fps`, exact: true})
    .click();
  assert.match(await dialog.innerText(), /Current frame/);
  await page.waitForFunction(
    () =>
      [...document.querySelectorAll('[data-animation-export] button')].some(
        button => button.textContent === 'Export MP4' && !button.disabled,
      ),
    undefined,
    {timeout: 120_000},
  );
  await page.screenshot({path: join(out, 'web-settings.png'), fullPage: true});
  const download = page.waitForEvent('download', {timeout: 180_000});
  await dialog.getByRole('button', {name: 'Export MP4', exact: true}).click();
  await (await download).saveAs(join(out, 'web.mp4'));
  await page.screenshot({path: join(out, 'web-export.png'), fullPage: true});
  let project;
  for (let attempt = 0; attempt < 50; attempt++) {
    project = await page.evaluate(
      () =>
        new Promise((resolve, reject) => {
          const request = indexedDB.open('keyval-store');
          request.onerror = () => reject(request.error);
          request.onsuccess = () => {
            const db = request.result;
            const read = db
              .transaction('keyval')
              .objectStore('keyval')
              .get('document');
            read.onsuccess = () => {
              db.close();
              resolve(read.result);
            };
            read.onerror = () => reject(read.error);
          };
        }),
    );
    if (
      project?.animation?.steps?.length === 2 &&
      project.editor.editors[1].code === codes[1]
    )
      break;
    await page.waitForTimeout(100);
  }
  assert.equal(project.animation.steps.length, 2);
  assert.equal(project.animation.fps, requestedFps);
  assert.deepEqual(
    project.editor.editors.map(editor => editor.code),
    codes,
  );
  assert.equal(project.frame.visible, scenario !== 'hidden');
  assert.equal(
    project.frame.signature?.handle ?? null,
    scenario === 'signature' ? '@step_size' : null,
  );
  assert.equal(project.frame.aspectRatio, null);
  assert.equal(project.frame.exportTarget, null);

  return project;
}
