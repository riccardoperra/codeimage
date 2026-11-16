import assert from 'node:assert/strict';
import {resolve} from 'node:path';
import {lineNumberVariants, setLineNumbers} from './line-mark-numbers.mjs';
import {
  pointGeometry,
  lineGeometry,
  assertPlaced,
} from './line-mark-geometry.mjs';

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
