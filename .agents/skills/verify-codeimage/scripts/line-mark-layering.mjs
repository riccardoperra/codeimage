import assert from 'node:assert/strict';
import {resolve} from 'node:path';
import {PNG} from 'pngjs';

const popups = '.cm-lineMarkControl, .cm-lineMarkMenu, .cm-lineMarkToolbar';

const numbersGutter =
  '.cm-editor:has(.cm-content[contenteditable=true]) .cm-lineNumbers';

export const lineNumberVariants = [
  ['off', false],
  ['on', true],
];

export async function setLineNumbers(page, on) {
  const shown = async () => (await page.locator(numbersGutter).count()) > 0;
  if ((await shown()) !== on) {
    await page.keyboard.press('ControlOrMeta+k');
    const search = page.getByRole('combobox', {
      name: 'Search themes and options',
      exact: true,
    });
    await search.fill('Line number');
    await page
      .getByRole('option', {name: /^Toggle Line number/})
      .first()
      .click();
    await search.waitFor({state: 'hidden'});
  }
  await page
    .locator(numbersGutter)
    .first()
    .waitFor({state: on ? 'attached' : 'detached'});
}

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

function placement(page) {
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

async function pointGeometry(page, point) {
  return page.evaluate(point => {
    const editor = document.querySelector(
      '.cm-editor:has(.cm-content[contenteditable=true])',
    );
    const marker = document.querySelector('.cm-lineMarkMarker[data-active]');
    const index = Number(marker?.dataset.markLine);
    const row = [
      ...editor.querySelectorAll('.cm-content[contenteditable=true] .cm-line'),
    ].find(row => row.textContent === `const value${index} = ${index};`);
    const rect = element => {
      const box = element?.getBoundingClientRect();
      return (
        box && {
          left: box.left,
          top: box.top,
          right: box.right,
          bottom: box.bottom,
        }
      );
    };
    const own = row.getBoundingClientRect();
    return {
      lineNumber: index,
      clicked: document.elementFromPoint(point.x, point.y)?.closest('.cm-line')
        ?.textContent,
      line: rect(row),
      content: rect(editor.querySelector('.cm-content')),
      slot: rect(
        [...editor.querySelectorAll('.cm-lineMarkSlot')].find(slot => {
          const box = slot.getBoundingClientRect();
          const middle = (box.top + box.bottom) / 2;
          return middle >= own.top && middle <= own.bottom;
        }),
      ),
      viewport: {width: innerWidth, height: innerHeight},
      marker: rect(marker),
    };
  }, point);
}

async function lineGeometry(page, line) {
  return page.evaluate(line => {
    const editor = document.querySelector(
      '.cm-editor:has(.cm-content[contenteditable=true])',
    );
    const row = editor.querySelectorAll('.cm-line')[line - 1];
    const marker = document.querySelector(
      `.cm-lineMarkMarker[data-mark-line="${line}"]`,
    );
    const rect = element => {
      const box = element?.getBoundingClientRect();
      return (
        box && {
          left: box.left,
          top: box.top,
          right: box.right,
          bottom: box.bottom,
        }
      );
    };
    return {
      scale: Number(
        document.querySelector('[data-fit-scale]')?.dataset.fitScale,
      ),
      line: rect(row),
      content: rect(editor.querySelector('.cm-content')),
      slot: rect(
        [...editor.querySelectorAll('.cm-lineMarkSlot')].find(slot => {
          const box = slot.getBoundingClientRect();
          const middle = (box.top + box.bottom) / 2;
          const own = row.getBoundingClientRect();
          return middle >= own.top && middle <= own.bottom;
        }),
      ),
      viewport: {width: innerWidth, height: innerHeight},
      marker: rect(marker),
      menu: rect(document.querySelector('.cm-lineMarkMenu')),
      toolbar: rect(document.querySelector('.cm-lineMarkToolbar')),
    };
  }, line);
}

function assertPlaced(geometry, label, centred = true) {
  const {line, marker, content, slot, viewport} = geometry;
  assert.ok(marker, `${label}: marker shown`);
  assert.ok(
    marker.top >= 0 &&
      marker.bottom <= viewport.height &&
      marker.left >= 0 &&
      marker.right <= viewport.width,
    `${label}: marker on screen (${JSON.stringify(marker)})`,
  );
  assert.ok(slot, `${label}: gutter column rendered`);
  const middle = (line.top + line.bottom) / 2;
  assert.ok(
    !centred || Math.abs((marker.top + marker.bottom) / 2 - middle) <= 2,
    `${label}: marker centred on its line (${JSON.stringify({marker, line})})`,
  );
  assert.ok(
    Math.abs(marker.right - slot.right) <= 1 &&
      marker.right <= content.left + 1,
    `${label}: marker in the gutter column beside the code (${JSON.stringify({marker, slot, content})})`,
  );
}

export async function verifyLineMarkZoom({page, editor, out}) {
  const results = {};
  for (const [numbers, on] of lineNumberVariants) {
    await setLineNumbers(page, on);
    results[numbers] = await zoomPlacement({page, editor, out, numbers});
    results[numbers].overflow = await overflowHidden({page, editor, numbers});
  }
  return results;
}

async function overflowHidden({page, editor, numbers}) {
  const lines = 1200;
  await editor.fill(
    Array.from(
      {length: lines},
      (_, i) => `const value${i + 1} = ${i + 1};`,
    ).join('\n'),
  );
  await page.waitForTimeout(300);
  const measure = target =>
    page.evaluate(target => {
      const frame = document.querySelector('[data-fit-scale]');
      const area = frame.parentElement.getBoundingClientRect();
      const box = element => {
        const rect = element?.getBoundingClientRect();
        return rect && {top: rect.top, bottom: rect.bottom};
      };
      return {
        scale: Number(frame.dataset.fitScale),
        area: {top: area.top, bottom: area.bottom},
        frame: box(frame),
        target,
        marker: box(
          document.querySelector(
            `.cm-lineMarkMarker[data-mark-line="${target}"]`,
          ),
        ),
      };
    }, target);
  await editor.press('ControlOrMeta+Home');
  await page.waitForTimeout(300);
  await page.evaluate(() => {
    const canvas = document.querySelector('[data-fit-scale]').parentElement;
    canvas.scrollTop = canvas.scrollHeight;
  });
  await page.waitForTimeout(300);
  const state = await measure(1);
  assert.ok(
    state.frame.top < state.area.top - 100,
    `${numbers}: the first line is scrolled out of the canvas (${JSON.stringify(state)})`,
  );
  assert.ok(state.marker, `${numbers}: the cut-off line has a marker`);
  assert.ok(
    state.marker.bottom <= 0 || state.marker.top >= state.area.bottom,
    `${numbers}: a marker whose line is cut off by the canvas is hidden (${JSON.stringify(state)})`,
  );
  const content = await editor.boundingBox();
  const point = {
    x: content.x + Math.min(40, content.width / 2),
    y: (state.area.top + state.area.bottom) / 2,
  };
  await page.mouse.click(point.x, point.y);
  await page.locator('.cm-lineMarkMarker[data-active]').waitFor();
  await page.waitForTimeout(100);
  const middle = await pointGeometry(page, point);
  assertPlaced(
    middle,
    `${numbers} overflow: line in the middle of the canvas`,
    false,
  );
  middle.drift =
    (middle.marker.top + middle.marker.bottom) / 2 -
    (middle.line.top + middle.line.bottom) / 2;
  state.middle = middle;
  return state;
}

async function zoomPlacement({page, editor, out, numbers}) {
  const results = {};
  for (const [name, lines] of [
    ['full', 6],
    ['zoomed', 90],
  ]) {
    await editor.fill(
      Array.from(
        {length: lines},
        (_, i) => `const value${i + 1} = ${i + 1};`,
      ).join('\n'),
    );
    await editor.press('ControlOrMeta+Home');
    await editor.press('ArrowDown');
    await editor.press('ArrowDown');
    await page.waitForTimeout(300);
    const line = 3;
    const before = await lineGeometry(page, line);
    if (name === 'full') assert.equal(before.scale, 1);
    else assert.ok(before.scale < 1, `zoom below 1 (${before.scale})`);
    await page
      .locator('.cm-content[contenteditable=true] .cm-line')
      .nth(line - 1)
      .hover();
    await page
      .locator(`.cm-lineMarkMarker[data-mark-line="${line}"]`)
      .waitFor();
    const hovered = await lineGeometry(page, line);
    assertPlaced(hovered, `${numbers} ${name}`);
    await page.locator(`.cm-lineMarkMarker[data-mark-line="${line}"]`).click();
    await page.getByRole('menu', {name: 'Line marks', exact: true}).waitFor();
    const opened = await lineGeometry(page, line);
    assert.ok(
      Math.abs(opened.menu.top - (opened.marker.bottom + 4)) <= 2 ||
        Math.abs(opened.menu.top - (opened.line.bottom + 4)) <= 2,
      `${numbers} ${name}: menu below its marker (${JSON.stringify(opened)})`,
    );
    await page.screenshot({
      path: resolve(out, `line-mark-zoom-${numbers}-${name}-menu.png`),
    });
    await page.keyboard.press('Escape');
    await editor.click();
    await editor.press('ControlOrMeta+Home');
    await editor.press('ArrowDown');
    await editor.press('Shift+ArrowDown');
    await page
      .getByRole('toolbar', {name: 'Line marks', exact: true})
      .waitFor();
    await page.waitForTimeout(100);
    const selected = await lineGeometry(page, 2);
    assert.ok(
      Math.abs(selected.toolbar.bottom - (selected.line.top - 4)) <= 2,
      `${numbers} ${name}: toolbar above the selection (${JSON.stringify(selected)})`,
    );
    assert.ok(
      selected.toolbar.left >= selected.content.left - 2,
      `${numbers} ${name}: toolbar starts at the code`,
    );
    await page.screenshot({
      path: resolve(out, `line-mark-zoom-${numbers}-${name}-toolbar.png`),
    });
    results[name] = {hovered, opened, selected};
  }
  return results;
}

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
