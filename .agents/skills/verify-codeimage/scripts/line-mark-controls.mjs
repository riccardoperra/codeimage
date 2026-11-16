import assert from 'node:assert/strict';
import {resolve} from 'node:path';

export async function verifyLineMarkControls({page, editor, section, out}) {
  const fixture = Array.from(
    {length: 10},
    (_, i) => `const value${i + 1} = ${i + 1};`,
  ).join('\n');
  await editor.fill(fixture);
  await editor.press('ControlOrMeta+a');
  await editor.press('ControlOrMeta+Alt+0');
  await editor.press('ControlOrMeta+Home');
  const line = number => editor.locator('.cm-line').nth(number - 1);
  const marker = number =>
    page.locator(`.cm-lineMarkMarker[data-mark-line="${number}"]`);
  const menu = page.getByRole('menu', {name: 'Line marks', exact: true});
  const toolbar = page.getByRole('toolbar', {name: 'Line marks', exact: true});
  const focusedMarker = number =>
    page.waitForFunction(
      number =>
        document.activeElement?.matches(
          `.cm-lineMarkMarker[data-mark-line="${number}"]`,
        ),
      number,
    );
  const open = async number => {
    await line(number).hover();
    await marker(number).click();
    await menu.waitFor();
  };
  await open(2);
  assert.equal(
    await menu.locator('.cm-lineMarkMenuHeader').innerText(),
    'Line 2',
  );
  assert.equal(
    await menu
      .getByRole('menuitem', {name: 'Remove mark', exact: true})
      .isDisabled(),
    true,
  );
  await page.screenshot({path: resolve(out, 'line-mark-menu-mouse.png')});
  await menu.press('Escape');
  await focusedMarker(2);
  await section('themes');
  await open(2);
  const themes = page.getByRole('listbox').first();
  const before = await themes.evaluate(element => element.scrollTop);
  await themes.hover();
  await page.mouse.wheel(0, 200);
  await page.waitForFunction(
    before => document.querySelector('[role=listbox]')?.scrollTop > before,
    before,
  );
  assert.equal(
    await menu.isVisible(),
    true,
    'side-panel scroll keeps the gutter menu open',
  );
  await menu.press('Escape');
  await focusedMarker(2);
  assert.equal(
    await page.locator('.cm-lineMarkMarker[data-hovered]').count(),
    0,
  );
  assert.equal(await menu.count(), 0);
  await page.keyboard.press('ArrowDown');
  await focusedMarker(3);
  await page.keyboard.press('End');
  await focusedMarker(10);
  await page.keyboard.press('ArrowDown');
  await focusedMarker(10);
  await page.keyboard.press('Home');
  await focusedMarker(1);
  await page.keyboard.press('ArrowUp');
  await focusedMarker(1);
  await page.keyboard.press('Enter');
  await menu.getByRole('menuitemradio', {name: 'Added', exact: true}).waitFor();
  assert.equal(
    await menu
      .getByRole('menuitemradio', {name: 'Added', exact: true})
      .evaluate(element => element === document.activeElement),
    true,
  );
  await page.keyboard.press('ArrowDown');
  assert.equal(
    await menu
      .getByRole('menuitemradio', {name: 'Removed', exact: true})
      .evaluate(element => element === document.activeElement),
    true,
  );
  await page.keyboard.press('Home');
  await page.keyboard.press('Enter');
  await editor.locator('[data-mark="added"]').waitFor();
  await focusedMarker(1);
  await page.keyboard.press('ControlOrMeta+z');
  await page.waitForFunction(
    () =>
      !document.querySelector(
        '.cm-content[contenteditable=true] [data-mark=added]',
      ),
  );
  await focusedMarker(1);
  await page.keyboard.press('Space');
  await menu.waitFor();
  await page.keyboard.press('Escape');
  await focusedMarker(1);
  const aria = await marker(1).evaluate(element => ({
    hidden: !!element.closest('[aria-hidden=true]'),
    tabIndex: element.tabIndex,
  }));
  assert.deepEqual(aria, {hidden: false, tabIndex: 0});
  assert.equal(
    await page
      .locator('.cm-editor:has(.cm-content[contenteditable=true]) .cm-gutters')
      .getAttribute('aria-hidden'),
    'true',
  );
  assert.equal(
    await page.locator('.cm-lineMarkMarker[tabindex="0"]').count(),
    1,
  );
  await page.keyboard.press('Tab');
  await page.keyboard.press('Shift+Tab');
  await focusedMarker(1);
  await editor.click();
  await editor.press('ControlOrMeta+Home');
  await editor.press('Shift+ArrowDown');
  await toolbar.waitFor();
  await page.waitForFunction(
    () =>
      document
        .querySelector('.cm-lineMarkMarker[data-mark-line="2"]')
        ?.getBoundingClientRect().top >= 0,
  );
  await toolbar.getByRole('button', {name: 'Highlight', exact: true}).click();
  await editor.locator('[data-mark="highlight"]').waitFor();
  await page.getByPlaceholder('Search theme...', {exact: true}).click();
  await toolbar.waitFor({state: 'detached'});
  await editor.focus();
  await toolbar.waitFor();
  await page.screenshot({
    path: resolve(out, 'line-mark-toolbar-refocused.png'),
  });
  await editor.press('ControlOrMeta+a');
  await editor.press('ControlOrMeta+Alt+0');
  await editor.press('ControlOrMeta+Home');
  await section('code');
  const numbers = page.locator('[data-control="editor.lineNumbers"]');
  if (await numbers.count()) {
    const toggle = numbers.getByRole('switch');
    if ((await toggle.getAttribute('aria-checked')) !== 'true')
      await toggle.press('Space');
  } else {
    const toggle = page.getByRole('switch', {name: 'Line number', exact: true});
    if ((await toggle.getAttribute('aria-checked')) !== 'true')
      await toggle.press('Space');
  }
  const number = page.locator(
    '.cm-editor:has(.cm-content[contenteditable=true]) .cm-lineNumbers .cm-gutterElement',
  );
  const first = await number.nth(1).boundingBox();
  const lastLine = await line(10).boundingBox();
  assert.ok(first && lastLine);
  await page.mouse.move(first.x + first.width / 2, first.y + first.height / 2);
  await page.mouse.down();
  await page.mouse.move(
    first.x + first.width / 2,
    lastLine.y + lastLine.height + 50,
    {steps: 10},
  );
  await page.mouse.up();
  assert.equal(
    await editor.locator('[data-mark="highlight"]').count(),
    10,
    'dragging below the editor marks through the last line',
  );
  const last = await number.last().boundingBox();
  const firstLine = await line(1).boundingBox();
  await page.mouse.move(last.x + last.width / 2, last.y + last.height / 2);
  await page.mouse.down();
  await page.mouse.move(last.x + last.width / 2, firstLine.y - 50, {steps: 10});
  await page.mouse.up();
  assert.equal(
    await editor.locator('[data-mark="highlight"]').count(),
    0,
    'dragging above the editor clears through the first line',
  );
  await page.screenshot({path: resolve(out, 'line-mark-drag-clamped.png')});
  return {
    mouseMenu: true,
    sidePanelScroll: true,
    keyboardMenu: true,
    markerNavigation: true,
    toolbarFocus: true,
    clampBelow: true,
    clampAbove: true,
  };
}

export async function verifyLineMarkTouch({page, editor, out}) {
  await editor.fill('const phone = 1;\nconst other = 2;\nconst last = 3;');
  await editor.press('ControlOrMeta+Home');
  assert.equal(
    await page.evaluate(() => matchMedia('(pointer: coarse)').matches),
    true,
  );
  const marker = page.locator('.cm-lineMarkMarker[data-mark-line="1"]');
  await page.waitForFunction(() =>
    document
      .querySelector('.cm-lineMarkMarker[data-mark-line="1"]')
      ?.hasAttribute('data-active'),
  );
  const target = await marker.boundingBox();
  assert.ok(target.width >= 20 && target.height >= 24);
  await marker.tap();
  const menu = page.getByRole('menu', {name: 'Line marks', exact: true});
  await menu.waitFor();
  const box = await menu.boundingBox();
  assert.ok(
    box.x >= 8 &&
      box.x + box.width <= 382 &&
      box.y >= 8 &&
      box.y + box.height <= 836,
  );
  await menu.getByRole('menuitemradio', {name: 'Added', exact: true}).tap();
  await editor.locator('[data-mark="added"]').waitFor();
  assert.equal(
    await page.locator('.cm-lineMarkMarker[data-hovered]').count(),
    0,
  );
  await marker.tap();
  await menu.waitFor();
  await menu.getByRole('menuitemcheckbox', {name: 'Focus', exact: true}).tap();
  await editor.locator('[data-focused="true"]').waitFor();
  await page.screenshot({path: resolve(out, 'line-mark-phone.png')});
  return {touchMenu: true, target, menu: box, noStickyHover: true};
}
