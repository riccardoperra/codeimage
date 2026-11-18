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
    await page.setViewportSize(viewport);
    return {viewports: checks, ...(await auditSettingsAssets(page))};
  } finally {
    await page.setViewportSize(viewport);
  }
}

async function auditSettingsAssets(page) {
  const fontFamilies = ['Inter', 'Inter var'];
  const fontsLoaded = await page.evaluate(
    async families =>
      Promise.all(
        families.map(async family => {
          const faces = await document.fonts.load(`500 16px "${family}"`);
          return faces.some(face => face.status === 'loaded');
        }),
      ),
    fontFamilies,
  );
  assert.deepEqual(fontsLoaded, [true, true]);

  const trigger = page.locator('[data-settings-trigger]:visible').first();
  const triggerIcon = await trigger.locator('svg').boundingBox();
  assert.ok(triggerIcon && triggerIcon.width >= 16);
  await trigger.click();
  const close = page.getByRole('button', {name: 'Close', exact: true});
  const closeIcon = await close.locator('svg').boundingBox();
  assert.ok(closeIcon && closeIcon.width >= 16);
  await closeSettingsDialog(page);

  return {fontFamilies, iconWidths: [triggerIcon.width, closeIcon.width]};
}
