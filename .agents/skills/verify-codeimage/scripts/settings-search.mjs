import assert from 'node:assert/strict';

export async function closeSettingsDialog(page) {
  await page.getByRole('button', {name: 'Close', exact: true}).click();
  await page
    .locator('[data-settings-section=general]')
    .waitFor({state: 'hidden'});
}

async function checkSearch(page) {
  const trigger = page.locator('[data-settings-trigger]:visible').first();
  const panel = page.locator('[data-settings]');
  const island = panel.locator('[data-solid2-island="settings-search"]');
  const input = island.getByRole('textbox', {name: 'Search settings'});
  const focused = page.locator(':focus');
  const general = panel.locator('[data-settings-section="general"]');

  await trigger.click();
  await panel
    .locator('[data-settings-section][aria-current="page"]')
    .and(focused)
    .waitFor();
  await page.keyboard.press('/');
  await input.and(focused).waitFor();
  await input.fill('scale');
  await panel.locator('[data-setting="export-scale"]').waitFor();

  await input.press('Escape');
  await panel
    .locator('[data-setting="export-scale"]')
    .waitFor({state: 'hidden'});
  assert.equal(await input.inputValue(), '');
  assert.equal(await panel.isVisible(), true);

  await input.press('ArrowDown');
  await general.and(focused).waitFor();
  await general.press('Escape');
  await island.waitFor({state: 'detached'});
  await trigger.and(focused).waitFor();
}

export async function auditSettingsSearch(page) {
  const viewport = page.viewportSize();
  assert.ok(viewport);
  const checks = [];
  try {
    for (const size of [
      {width: 1440, height: 900},
      {width: 390, height: 844},
    ]) {
      await page.setViewportSize(size);
      await checkSearch(page);
      checks.push(size.width);
    }
    return {viewports: checks};
  } finally {
    await page.setViewportSize(viewport);
  }
}
