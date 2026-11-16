import assert from 'node:assert/strict';
import {PNG} from 'pngjs';

export async function auditLineMarks({
  page,
  editor,
  section,
  out,
  feature,
  fresh,
  download,
  shot,
}) {
  await feature('line-mark-controls-phone', () =>
    fresh(
      {
        name: 'line-mark-controls-phone',
        layout: 'inspector',
        viewport: {width: 390, height: 844},
        hasTouch: true,
      },
      async ({page, doctor, editor}) => {
        await doctor();
        const {verifyLineMarkTouch} = await import('./line-mark-controls.mjs');
        return verifyLineMarkTouch({page, editor: editor(), out});
      },
    ),
  );
  await feature('line-mark-controls', async () => {
    const {verifyLineMarkControls} = await import('./line-mark-controls.mjs');
    return verifyLineMarkControls({page, editor: editor(), section, out});
  });
  await feature('line-mark-tab-order', async () => {
    const {verifyLineMarkTabOrder} = await import('./line-mark-layering.mjs');
    return verifyLineMarkTabOrder({page, editor: editor(), out});
  });
  await feature('line-mark-zoom', async () => {
    const {verifyLineMarkZoom} = await import('./line-mark-layering.mjs');
    return verifyLineMarkZoom({page, editor: editor(), out});
  });
  await feature('line-mark-layouts', async () => {
    const {verifyLineMarkLayout} = await import('./line-mark-layering.mjs');
    const layouts = {};
    for (const layout of ['inspector', 'dock', 'studio'])
      layouts[layout] = await fresh(
        {
          name: `line-mark-layouts-${layout}`,
          layout,
          viewport: {width: 1440, height: 1000},
        },
        async ({page, doctor, editor}) => {
          await doctor();
          return verifyLineMarkLayout({page, editor: editor(), out, layout});
        },
      );
    return layouts;
  });
  await feature('line-mark-export-clean', async () => {
    const {verifyLineMarkExportClean} =
      await import('./line-mark-layering.mjs');
    return verifyLineMarkExportClean({page, editor: editor(), out, download});
  });
  await feature('line-mark-rail-sheet-phone', async () => {
    const {verifyLineMarkRailSheet, lineNumberVariants, setLineNumbers} =
      await import('./line-mark-layering.mjs');
    const variants = {};
    for (const [numbers, on] of lineNumberVariants)
      variants[numbers] = await fresh(
        {
          name: `line-mark-rail-sheet-phone-${numbers}`,
          layout: 'studio',
          viewport: {width: 390, height: 844},
          hasTouch: true,
        },
        async ({page, doctor, editor}) => {
          await doctor();
          await setLineNumbers(page, on);
          return verifyLineMarkRailSheet({
            page,
            editor: editor(),
            out,
            numbers,
          });
        },
      );
    return variants;
  });
  await feature('line-marks', async () => {
    await editor().fill('const marked = 1;\nconst other = 2;');
    await editor().press('ControlOrMeta+a');
    await editor().press('ControlOrMeta+Alt+0');
    await editor().locator('[data-mark]').first().waitFor({state: 'detached'});
    await editor().press('ControlOrMeta+Home');
    await editor().press('ControlOrMeta+Alt+1');
    await editor().locator('[data-mark="highlight"]').waitFor();
    PNG.sync.read(await download('line-marks.png'));
    await editor().press('ControlOrMeta+Alt+0');
    assert.equal(await editor().locator('[data-mark="highlight"]').count(), 0);
    const diff =
      'diff --git a/demo.ts b/demo.ts\n--- a/demo.ts\n+++ b/demo.ts\n@@ -1 +1 @@\n-const before = 1;\n+const after = 2;\n';
    await page.evaluate(text => navigator.clipboard.writeText(text), diff);
    await editor().click();
    await editor().press('ControlOrMeta+a');
    await editor().press('ControlOrMeta+v');
    await page
      .getByRole('button', {name: 'Import as diff', exact: true})
      .click();
    await editor().locator('[data-mark="added"]').first().waitFor();
    assert.match(await editor().innerText(), /const after = 2/);
    await shot('diff-import');
    await page.getByRole('button', {name: 'Undo', exact: true}).last().click();
  });
}
