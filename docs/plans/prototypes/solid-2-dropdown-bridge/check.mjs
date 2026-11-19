import assert from 'node:assert/strict';
import {chromium} from 'playwright';

const browser = await chromium.launch({channel: 'chrome'});
const page = await browser.newPage({viewport: {width: 728, height: 460}});
page.setDefaultTimeout(5000);
const errors = [];
page.on('pageerror', error => errors.push(error.stack ?? error.message));
page.on('console', entry => {
  if (['error', 'warning'].includes(entry.type())) errors.push(entry.text());
});

try {
  await page.goto(new URL('./dist/index.html', import.meta.url).href);
  const trigger = page.getByRole('button', {name: 'Menu', exact: true});
  const kobalte = page.getByRole('button', {name: 'Apri Kobalte'});
  const menu = page.getByRole('menu');
  const menuNode = page.locator('[role="menu"]');
  const focused = page.locator(':focus');
  const lastAction = page.locator('#last-action');
  const eventCount = page.locator('#event-count');

  await trigger.click();
  await menu.waitFor();
  assert.equal(await menu.evaluate(node => !node.closest('#app')), true);
  await menu.getByRole('menuitem', {name: 'Rinomina'}).click();
  await lastAction.filter({hasText: /^rename$/}).waitFor();
  await eventCount.filter({hasText: /^1$/}).waitFor();
  await menuNode.waitFor({state: 'detached'});

  await trigger.press('ArrowDown');
  await menu.getByRole('menuitem', {name: 'Rinomina'}).and(focused).waitFor();
  await page.keyboard.press('ArrowDown');
  await menu.getByRole('menuitem', {name: 'Duplica'}).and(focused).waitFor();
  await page.keyboard.press('Enter');
  await menuNode.waitFor({state: 'detached'});
  await trigger.and(focused).waitFor();
  assert.equal(await eventCount.textContent(), '1');
  await trigger.click();
  await menu.getByRole('menuitem', {name: 'Duplica'}).click();
  await lastAction.filter({hasText: /^duplicate$/}).waitFor();
  await eventCount.filter({hasText: /^2$/}).waitFor();

  await page.getByRole('button', {name: 'Passa a EN'}).click();
  await trigger.press('ArrowDown');
  await menu.getByRole('menuitem', {name: 'Rename'}).and(focused).waitFor();
  await page.keyboard.press('Escape');
  await menuNode.waitFor({state: 'detached'});
  await trigger.and(focused).waitFor();

  await kobalte.press('ArrowDown');
  await menu
    .getByRole('menuitem', {name: 'Kobalte option'})
    .and(focused)
    .waitFor();
  await page.keyboard.press('Enter');
  await lastAction.filter({hasText: /^kobalte$/}).waitFor();
  await eventCount.filter({hasText: /^3$/}).waitFor();
  await kobalte.and(focused).waitFor();

  await trigger.press('ArrowDown');
  await menu.waitFor();
  await page
    .getByRole('button', {name: 'Smonta componenti', includeHidden: true})
    .dispatchEvent('click');
  await menuNode.waitFor({state: 'detached'});
  await page.getByText('Componenti smontati').waitFor();
  assert.equal(
    await page.getByRole('button', {name: 'Save', exact: true}).count(),
    0,
  );
  await page.getByRole('button', {name: 'Rimonta componenti'}).click();
  await trigger.click();
  await menu.getByRole('menuitem', {name: 'Delete'}).click();
  await lastAction.filter({hasText: /^delete$/}).waitFor();
  await eventCount.filter({hasText: /^4$/}).waitFor();
  await menuNode.waitFor({state: 'detached'});

  const saveEnglish = page.getByRole('button', {name: 'Save', exact: true});
  await saveEnglish.click();
  await lastAction.filter({hasText: /^save-en$/}).waitFor();
  await eventCount.filter({hasText: /^5$/}).waitFor();
  const originalButton = await saveEnglish.elementHandle();
  await page.getByRole('button', {name: 'Passa a IT'}).click();
  const saveItalian = page.getByRole('button', {name: 'Salva', exact: true});
  assert.equal(
    await saveItalian.evaluate(
      (node, original) => node === original,
      originalButton,
    ),
    true,
  );
  await page.getByRole('button', {name: 'Disabilita Button'}).click();
  assert.equal(await saveItalian.isDisabled(), true);
  const bounds = await saveItalian.boundingBox();
  assert.ok(bounds);
  await page.mouse.click(
    bounds.x + bounds.width / 2,
    bounds.y + bounds.height / 2,
  );
  assert.equal(await eventCount.textContent(), '5');
  await page.getByRole('button', {name: 'Abilita Button'}).click();
  await saveItalian.press('Enter');
  await lastAction.filter({hasText: /^save-it$/}).waitFor();
  await eventCount.filter({hasText: /^6$/}).waitFor();

  assert.deepEqual(errors, []);
  process.stdout.write(
    'Passed: CodeUI Button props and callbacks; ProjectItem Dropdown and direct Kobalte; focus, portal, disposal and remount.\n',
  );
} finally {
  await browser.close();
}
