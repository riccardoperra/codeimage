import assert from 'node:assert/strict';
import {resolve} from 'node:path';
import {lineNumberVariants, setLineNumbers} from './line-mark-numbers.mjs';
import {lineGeometry, assertPlaced} from './line-mark-geometry.mjs';

export async function verifyLineMarkRailSheet({page, editor, out, numbers}) {
  await editor.fill(
    Array.from({length: 6}, (_, i) => `const value${i + 1} = ${i + 1};`).join(
      '\n',
    ),
  );
  await page.locator('nav button[aria-controls="sidebar-panel"]').first().tap();
  await page.locator('#sidebar-panel').waitFor();
  await page.waitForTimeout(600);
  await editor.locator('.cm-line').last().tap();
  const marker = page.locator('.cm-lineMarkMarker[data-mark-line="6"]');
  await marker.waitFor();
  await page.waitForTimeout(200);
  const placed = await lineGeometry(page, 6);
  assertPlaced(placed, `${numbers}: marker above the sheet`);
  await marker.tap();
  await page.getByRole('menu', {name: 'Line marks', exact: true}).waitFor();
  await page.waitForTimeout(200);
  const layers = await page.evaluate(() => {
    const sheet = document.querySelector('#sidebar-panel');
    const box = sheet.getBoundingClientRect();
    const menu = document.querySelector('.cm-lineMarkMenu');
    const area = document
      .querySelector('[data-fit-scale]')
      .closest('[class]:has(> [data-fit-scale])')
      ?.parentElement.getBoundingClientRect();
    const rect = menu.getBoundingClientRect();
    const control = document.querySelector('.cm-lineMarkControl');
    const before = control.style.top;
    control.style.top = `${(box.top + box.bottom) / 2}px`;
    const probe = control.getBoundingClientRect();
    const hit = document.elementFromPoint(
      (probe.left + probe.right) / 2,
      (probe.top + probe.bottom) / 2,
    );
    control.style.top = before;
    return {
      menu: {top: rect.top, bottom: rect.bottom},
      sheet: {top: box.top, bottom: box.bottom},
      canvas: area && {top: area.top, bottom: area.bottom},
      menuClearOfSheet: rect.bottom <= box.top,
      markerUnderSheet: sheet.contains(hit),
    };
  });
  await page.screenshot({
    path: resolve(out, `line-mark-rail-sheet-${numbers}.png`),
  });
  assert.equal(
    layers.menuClearOfSheet,
    true,
    `the menu stays above the sheet (${JSON.stringify(layers)})`,
  );
  assert.equal(
    layers.markerUnderSheet,
    true,
    'a marker over the sheet is painted under it',
  );
  return {...layers, placed};
}

export async function verifyLineMarkLayout({page, editor, out, layout}) {
  const results = {};
  await editor.fill(
    ['const one = 1;', 'const two = 2;', 'const three = 3;'].join('\n'),
  );
  for (const [numbers, on] of lineNumberVariants) {
    await setLineNumbers(page, on);
    await editor.click();
    await editor.press('ControlOrMeta+Home');
    await page
      .locator('.cm-content[contenteditable=true] .cm-line')
      .nth(1)
      .hover();
    const marker = page.locator('.cm-lineMarkMarker[data-mark-line="2"]');
    await marker.waitFor();
    await page.waitForTimeout(100);
    const hovered = await lineGeometry(page, 2);
    assertPlaced(hovered, `${layout} ${numbers}`);
    await marker.click();
    await page.getByRole('menu', {name: 'Line marks', exact: true}).waitFor();
    await page.waitForTimeout(100);
    const opened = await lineGeometry(page, 2);
    assert.ok(
      Math.abs(opened.menu.top - (opened.marker.bottom + 4)) <= 2 ||
        Math.abs(opened.menu.top - (opened.line.bottom + 4)) <= 2,
      `${layout} ${numbers}: menu below its marker (${JSON.stringify(opened)})`,
    );
    assert.ok(
      opened.menu.left >= 0 && opened.menu.bottom <= opened.viewport.height,
      `${layout} ${numbers}: menu on screen`,
    );
    await page.screenshot({
      path: resolve(out, `line-mark-layout-${layout}-${numbers}.png`),
    });
    await page.keyboard.press('Escape');
    results[numbers] = {hovered, menu: opened.menu};
  }
  return results;
}
