import assert from 'node:assert/strict';
import {verifyKeyboardScroll} from './keyboard-scroll.mjs';
import {verifyRailSwitch} from './rail-switch.mjs';

export async function auditKeyboard({feature, fresh, out}) {
  await feature('keyboard-scroll', () => verifyKeyboardScroll({fresh, out}));
  await feature('rail-interrupted-close', () =>
    fresh(
      {
        name: 'rail-interrupted-close',
        layout: 'studio',
        viewport: {width: 390, height: 844},
        hasTouch: true,
      },
      verifyRailSwitch,
    ),
  );
  await feature('shortcut-help', async () => {
    for (const width of [1440, 390]) {
      await fresh(
        {
          name: `shortcut-help-${width}`,
          layout: 'inspector',
          viewport: {width, height: 900},
          hasTouch: width < 768,
        },
        verifyShortcutHelp,
      );
    }
  });
}

async function verifyShortcutHelp({page, doctor, editor}) {
  await doctor();
  page.setDefaultTimeout(10000);
  const trigger = page
    .locator('[data-shortcut-help]')
    .getByRole('button', {name: 'Keyboard shortcuts', exact: true});
  const help = page.getByRole('dialog', {name: 'Keyboard shortcuts'});
  const close = help.getByRole('button', {name: 'Close', exact: true});
  const frame = page.locator('[data-fit-scale]').first();
  const bounds = await frame.boundingBox();
  const desktop = page.viewportSize().width > 768;
  const size = desktop ? 36 : 40;
  const dimensions = await trigger.boundingBox();
  assert.ok(dimensions.width >= size && dimensions.height >= size);
  const buttonStyle = await trigger.evaluate(element => {
    const {minHeight, minWidth, columnGap} = getComputedStyle(element);
    return {minHeight, minWidth, columnGap};
  });
  assert.equal(buttonStyle.minHeight, `${size}px`);
  assert.equal(buttonStyle.minWidth, `${size}px`);
  if (desktop) assert.equal(buttonStyle.columnGap, '8px');

  await trigger.click();
  await help.getByText('Focus code editor', {exact: true}).waitFor();
  await help.and(page.locator(':focus-within')).waitFor();
  if (desktop) {
    await page.waitForFunction(() => {
      const trigger = document.querySelector('[data-shortcut-help] button');
      const help = document.querySelector('[data-shortcut-overlay]');
      if (!trigger || !help) return false;
      const a = trigger.getBoundingClientRect();
      const b = help.getBoundingClientRect();
      return Math.abs(b.left - a.left) <= 1 && b.top >= a.bottom + 7;
    });
    assert.deepEqual(await frame.boundingBox(), bounds);
    await page.keyboard.press('Escape');
  } else {
    assert.equal(await help.getAttribute('aria-modal'), 'true');
    await close.click();
  }
  await help.waitFor({state: 'hidden'});
  await trigger.and(page.locator(':focus')).waitFor();

  if (desktop) {
    await page.keyboard.press('?');
    await help.waitFor();
    await close.click();
    await help.waitFor({state: 'hidden'});
    await editor().fill('const workingAfterShortcuts = true;');
    await page.keyboard.press('?');
    assert.match(await editor().innerText(), /\?/);
    assert.equal(await help.isVisible(), false);
  }
}
