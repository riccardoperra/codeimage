import assert from 'node:assert/strict';

export async function verifyRailSwitch({page, doctor}) {
  await doctor();
  const rail = page.getByRole('navigation', {name: 'Editor panels'});
  const themes = rail.getByRole('button', {name: 'Themes', exact: true});
  const frame = rail.getByRole('button', {name: 'Frame', exact: true});
  const panel = page.locator('[data-control-panel]');
  const settle = () =>
    panel.evaluate(async element => {
      await Promise.allSettled(
        element.getAnimations().map(animation => animation.finished),
      );
      await new Promise(resolve =>
        requestAnimationFrame(() => requestAnimationFrame(resolve)),
      );
    });

  for (const reducedMotion of ['no-preference', 'reduce']) {
    await page.emulateMedia({reducedMotion});
    await themes.click();
    await settle();
    assert.equal(await themes.getAttribute('aria-expanded'), 'true');
    await themes.press('Enter');
    await frame.press('Enter');
    await settle();

    assert.equal(await themes.getAttribute('aria-expanded'), 'false');
    assert.equal(await frame.getAttribute('aria-expanded'), 'true');
    const region = page.getByRole('region', {name: 'Frame', exact: true});
    await region
      .getByRole('button', {name: 'Close Frame', exact: true})
      .click();
    await panel.waitFor({state: 'hidden'});
    await frame.and(page.locator(':focus')).waitFor();
  }
}
