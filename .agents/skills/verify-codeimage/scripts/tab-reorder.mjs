import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PNG} from 'pngjs';
import {resolve} from 'node:path';

const tabSelector = '[data-watermark-obstacle][id]:not([data-dnd-placeholder])';

function tabPaint(tab) {
  return tab.evaluate(element => {
    const style = getComputedStyle(element);
    return {
      background: style.backgroundColor,
      position: style.position,
      shadow: style.boxShadow,
      zoom: element.currentCSSZoom,
      popover: element.hasAttribute('popover'),
    };
  });
}

async function reorderTabs({page, strip, firstId, secondId, out, label}) {
  const tabs = strip.locator(tabSelector);
  const tab = id => strip.locator(`${tabSelector}[id="${id}"]`);
  const order = () => tabs.evaluateAll(elements => elements.map(el => el.id));
  const expectOrder = async ids => assert.deepEqual(await order(), ids);
  const target = id =>
    strip.locator(
      `[id="${id}"][data-tab-drop-target=true]:not([data-dnd-placeholder])`,
    );
  const dragging = strip.locator(
    '[data-active-drag=true]:not([data-dnd-placeholder])',
  );

  await tab(firstId).focus();
  await page.keyboard.press('Enter');
  assert.equal(await tab(firstId).getAttribute('data-active'), 'true');
  await page.keyboard.press('Space');
  await dragging.waitFor();
  await page.keyboard.press('ArrowRight');
  await target(secondId).waitFor();
  await expectOrder([firstId, secondId]);
  await page.keyboard.press('Escape');
  await dragging.waitFor({state: 'hidden'});
  assert.equal(
    await tab(firstId).evaluate(el => el === document.activeElement),
    true,
  );
  await expectOrder([firstId, secondId]);

  await page.keyboard.press('Space');
  await dragging.waitFor();
  await page.keyboard.press('ArrowRight');
  await target(secondId).waitFor();
  await page.keyboard.press('Space');
  await dragging.waitFor({state: 'hidden'});
  await expectOrder([secondId, firstId]);
  assert.equal(
    await tab(firstId).evaluate(el => el === document.activeElement),
    true,
  );

  await tab(secondId).press('Enter');
  const paintBeforeDrag = await tabPaint(tab(secondId));
  const touch = process.env.VERIFY_TOUCH === '1';
  const from = await tab(secondId).boundingBox();
  const to = await tab(firstId).boundingBox();
  assert.ok(from && to);
  const x = from.x + 8;
  const end = to.x + to.width / 2;
  const y = from.y + from.height / 2;
  const session = touch ? await page.context().newCDPSession(page) : null;
  const dispatch = (type, touchPoints) =>
    session.send('Input.dispatchTouchEvent', {type, touchPoints});
  try {
    if (touch) {
      await dispatch('touchStart', [{x, y}]);
      await dragging.waitFor();
      for (let step = 1; step <= 12; step++)
        await dispatch('touchMove', [{x: x + ((end - x) * step) / 12, y}]);
    } else {
      await page.mouse.move(x, y);
      await page.mouse.down();
      await page.mouse.move(end, y, {steps: 12});
    }
    await target(firstId).waitFor();
    await expectOrder([secondId, firstId]);
    assert.equal(await strip.locator('[data-dnd-placeholder]').count(), 0);
    assert.deepEqual(await tabPaint(tab(secondId)), paintBeforeDrag);
    assert.deepEqual(await tab(firstId).boundingBox(), to);
    const moved = await tab(secondId).boundingBox();
    assert.ok(moved);
    assert.ok(Math.abs(moved.x - from.x - (end - x)) < 1);
    assert.ok(Math.abs(moved.y - from.y) < 1);
    await page.screenshot({path: resolve(out, `${label}-dragging.png`)});
  } finally {
    if (touch) {
      await dispatch('touchEnd', []);
      await session.detach();
    } else {
      await page.mouse.up();
    }
  }
  await dragging.waitFor({state: 'hidden'});
  await expectOrder([firstId, secondId]);
  assert.equal(
    await tab(secondId).evaluate(element => element.style.translate),
    '',
  );
  return touch ? 'emulated touch' : 'mouse';
}

async function completeTabExtension(page, input, {prefix, extension, method}) {
  await input.fill(prefix);
  const list = page.getByRole('listbox', {name: 'Tab name', exact: true});
  const option = list.getByRole('option', {name: extension, exact: true});
  await option.waitFor();
  if (method === 'keyboard') {
    const optionId = await option.getAttribute('id');
    const count = await list.getByRole('option').count();
    for (let index = 0; index < count; index++) {
      await input.press('ArrowDown');
      if ((await input.getAttribute('aria-activedescendant')) === optionId)
        break;
    }
    assert.equal(await input.getAttribute('aria-activedescendant'), optionId);
    await input.press('Enter');
  } else {
    await option.click();
  }
  await list.waitFor({state: 'hidden'});
  assert.equal(await input.inputValue(), prefix.split('.')[0] + extension);
}

export async function auditTabLayouts({feature, fresh, ...options}) {
  for (const [name, style] of [
    ['tabs', 'Editor'],
    ['tabs-classic', 'macOS'],
  ]) {
    await feature(name, () =>
      fresh(
        {name, layout: 'inspector', viewport: {width: 1440, height: 900}},
        async ({doctor, page, editor}) => {
          await doctor();
          return auditTabs({...options, page, editor}, style);
        },
      ),
    );
  }
  await feature('plain-text-tab-icon', () =>
    fresh(
      {name: 'plain-text-tab-icon', layout: 'inspector'},
      async ({doctor, page}) => {
        await doctor();
        await completeTabExtension(
          page,
          page.getByRole('combobox', {name: 'Tab name', exact: true}),
          {prefix: 'plain.tx', extension: '.txt', method: 'keyboard'},
        );
        const icon = page.locator('main [data-active=true] svg path.path');
        await icon.waitFor();
        assert.equal(
          await icon.evaluate(path => getComputedStyle(path).fill),
          'rgb(255, 255, 255)',
        );
        await page
          .getByRole('textbox', {name: 'Search themes'})
          .fill('XCode Light');
        await page.getByRole('option', {name: /XCode Light/i}).click();
        await page
          .locator('main [data-codeimage-frame-mode=light]')
          .filter({has: page.locator('[data-active=true] svg path.path')})
          .waitFor();
        assert.equal(
          await icon.evaluate(path => getComputedStyle(path).fill),
          'rgb(60, 60, 60)',
        );
      },
    ),
  );
}

async function auditTabs(
  {page, out, editor, shot, windowStyle, unzipSync},
  style = 'Editor',
) {
  const classic = style === 'macOS';
  const label = classic ? 'tabs-classic' : 'tabs';
  await windowStyle(style);
  const strip = classic
    ? page.locator('main [data-accent-visible]:has(> button)')
    : page
        .locator('[data-window-tabs]')
        .filter({
          has: page.getByRole('button', {name: 'Add tab', exact: true}),
        })
        .first();
  const add = classic
    ? strip.locator(':scope > button')
    : strip.getByRole('button', {name: 'Add tab', exact: true});
  const closeTab = tab =>
    classic
      ? tab.locator('[data-tab-close]')
      : tab.getByRole('button', {name: 'Close tab', exact: true});
  const tabs = strip.locator(tabSelector);
  await tabs.first().waitFor();
  for (let count = await tabs.count(); count > 1; count--) {
    await closeTab(tabs.last()).click();
  }
  const readCode = async () =>
    (await editor().locator('.cm-line').allTextContents()).join('\n');
  const name = () =>
    strip
      .locator('[data-active="true"]')
      .getByRole('combobox', {name: 'Tab name', exact: true});
  await editor().fill('const first = 1;');
  await completeTabExtension(page, name(), {
    prefix: 'first.t',
    extension: '.ts',
    method: 'keyboard',
  });
  await add.click();
  await editor().fill('print("second")');
  await completeTabExtension(page, name(), {
    prefix: 'hello.p',
    extension: '.py',
    method: 'pointer',
  });
  await strip.locator(tabSelector).filter({hasText: 'first.ts'}).click();
  assert.equal(await readCode(), 'const first = 1;');
  await strip.locator(tabSelector).filter({hasText: 'hello.py'}).click();
  assert.equal(await readCode(), 'print("second")');
  const ids = await strip
    .locator(tabSelector)
    .evaluateAll(tabs => tabs.map(tab => tab.id));
  assert.equal(ids.length, 2);
  assert.equal(new Set(ids).size, 2, 'each tab has its own identity');
  const [firstId, secondId] = ids;
  assert.equal(
    await page.locator('[aria-roledescription="draggable"]').count(),
    2,
  );
  const input = await reorderTabs({page, strip, firstId, secondId, out, label});
  await strip.locator(`[id="${firstId}"]`).click();
  await name().fill('renamed.ts');
  await name().press('Escape');
  assert.equal(await name().getAttribute('aria-expanded'), 'false');
  assert.equal(await name().inputValue(), 'renamed.ts');
  assert.equal(await readCode(), 'const first = 1;');

  await strip.locator(`[id="${firstId}"]`).focus();
  await page.keyboard.press('Space');
  await page.keyboard.press('ArrowRight');
  await strip
    .locator(`[id="${secondId}"][data-tab-drop-target=true]`)
    .waitFor();
  await page.keyboard.press('Space');
  await strip
    .locator('[data-active-drag=true]:not([data-dnd-placeholder])')
    .waitFor({state: 'hidden'});
  await shot(`${label}-two`);
  await page.locator('[data-export-menu]').click();
  const [zip] = await Promise.all([
    page.waitForEvent('download', {timeout: 60000}),
    page.locator('[data-export-action="tabs"]').click(),
  ]);
  await zip.saveAs(resolve(out, `${label}.zip`));
  const entries = Object.entries(
    unzipSync(await readFile(resolve(out, `${label}.zip`))),
  );
  assert.deepEqual(entries.map(([name]) => name).sort(), [
    '01-hello.py.png',
    '02-renamed.ts.png',
  ]);
  const pngs = entries.map(([, data]) => PNG.sync.read(Buffer.from(data)));
  assert.ok(
    !pngs[0].data.equals(pngs[1].data),
    'each tab exports its own rendered pixels',
  );
  const active = strip.locator(`${tabSelector}[data-active="true"]`);
  const closedId = await active.getAttribute('id');
  assert.ok(closedId);
  await closeTab(active).click();
  await strip
    .locator(`${tabSelector}[id="${closedId}"]`)
    .waitFor({state: 'detached'});
  assert.equal(await tabs.count(), 1);
  assert.equal(await readCode(), 'print("second")');
  return {
    input,
    keyboard: ['activate', 'cancel', 'reorder'],
    zipEntries: entries.map(([name]) => name),
  };
}
