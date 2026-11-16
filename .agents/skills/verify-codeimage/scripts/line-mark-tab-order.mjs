import {lineGeometry, assertPlaced} from './line-mark-geometry.mjs';
import assert from 'node:assert/strict';
import {resolve} from 'node:path';
import {lineNumberVariants, setLineNumbers} from './line-mark-numbers.mjs';
const popups = '.cm-lineMarkControl, .cm-lineMarkMenu, .cm-lineMarkToolbar';

async function escapeEditor(page) {
  await page.keyboard.press('Escape');
  await page
    .locator('.cm-lineMarkMarker[data-active]')
    .waitFor({state: 'detached'});
}

function describeActive(page) {
  return page.evaluate(() => {
    const active = document.activeElement;
    const editor = document.querySelector(
      '.cm-editor:has(.cm-content[contenteditable=true])',
    );
    const frame = document.querySelector('[data-fit-scale]');
    return {
      tag: active?.tagName.toLowerCase(),
      marker: active?.getAttribute('data-mark-line') ?? null,
      content: !!active?.matches('.cm-content'),
      inEditor: !!editor?.contains(active),
      inFrame: !!frame?.contains(active),
      beforeEditor:
        !!editor &&
        !!active &&
        !!(
          editor.compareDocumentPosition(active) &
          Node.DOCUMENT_POSITION_PRECEDING
        ),
      afterFrame:
        !!frame &&
        !!active &&
        !frame.contains(active) &&
        !!(
          frame.compareDocumentPosition(active) &
          Node.DOCUMENT_POSITION_FOLLOWING
        ),
      label: active?.getAttribute('aria-label') ?? null,
    };
  });
}

export function placement(page) {
  return page.evaluate(popups => {
    const frame = document.querySelector('[data-fit-scale]');
    const exported = document
      .querySelector('.cm-editor[data-static-code-view]')
      ?.closest('body > *');
    return [...document.querySelectorAll(popups)].map(element => ({
      className: element.className,
      position: getComputedStyle(element).position,
      inZoom: !!frame?.contains(element),
      inExport: !!exported?.contains(element),
      afterFrame:
        !!frame &&
        !!(
          frame.compareDocumentPosition(element) &
          Node.DOCUMENT_POSITION_FOLLOWING
        ),
    }));
  }, popups);
}

export async function verifyLineMarkTabOrder({page, editor, out}) {
  const results = {};
  for (const [numbers, on] of lineNumberVariants) {
    await setLineNumbers(page, on);
    results[numbers] = await tabOrder({page, editor, out, numbers});
  }
  return results;
}

async function tabOrder({page, editor, out, numbers}) {
  await editor.fill(
    ['const one = 1;', 'const two = 2;', 'const three = 3;'].join('\n'),
  );
  await editor.press('ControlOrMeta+Home');
  await editor.press('ArrowDown');
  const steps = {};
  await escapeEditor(page);
  await page.keyboard.press('Shift+Tab');
  steps.escapeShiftTab = await describeActive(page);
  assert.equal(
    steps.escapeShiftTab.marker,
    '2',
    `${numbers}: Escape then Shift+Tab focuses the cursor line marker`,
  );
  const focused = await lineGeometry(page, 2);
  assertPlaced(focused, `${numbers}: focused marker`);
  await page.keyboard.press('Shift+Tab');
  steps.shiftTabFromMarker = await describeActive(page);
  assert.equal(steps.shiftTabFromMarker.marker, null);
  assert.equal(steps.shiftTabFromMarker.inEditor, false);
  assert.equal(
    steps.shiftTabFromMarker.beforeEditor,
    true,
    'Shift+Tab from the marker leaves for what precedes the editor',
  );
  await page.keyboard.press('Tab');
  steps.tabBack = await describeActive(page);
  assert.equal(steps.tabBack.marker, '2', 'Tab returns to the marker');
  await page.keyboard.press('Tab');
  steps.tabFromMarker = await describeActive(page);
  assert.equal(
    steps.tabFromMarker.content,
    true,
    'Tab from the marker enters the code',
  );
  await escapeEditor(page);
  await page.keyboard.press('Tab');
  steps.escapeTab = await describeActive(page);
  assert.equal(steps.escapeTab.marker, null);
  assert.equal(steps.escapeTab.inEditor, false);
  assert.equal(
    steps.escapeTab.afterFrame,
    true,
    'Escape then Tab leaves the editor for what follows the frame',
  );
  assert.equal(
    await page.locator('.cm-lineMarkMarker[tabindex="0"]').count(),
    0,
    'the entry before the editor is the only tab stop for the markers',
  );
  await editor.click();
  await editor.press('ControlOrMeta+Home');
  await editor.press('Shift+ArrowDown');
  await page.getByRole('toolbar', {name: 'Line marks', exact: true}).waitFor();
  const placed = await placement(page);
  for (const element of placed) {
    assert.equal(element.inZoom, false, `${element.className} outside zoom`);
    assert.equal(element.inExport, false, `${element.className} not exported`);
    assert.equal(element.afterFrame, true, `${element.className} after frame`);
    assert.equal(element.position, 'fixed', `${element.className} fixed`);
  }
  await page.screenshot({
    path: resolve(out, `line-mark-tab-order-${numbers}.png`),
  });
  return {steps, focused, placed};
}
