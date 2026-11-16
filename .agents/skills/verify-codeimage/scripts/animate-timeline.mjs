import assert from 'node:assert/strict';
import {createTimelineJourney} from './animate-timeline-journey.mjs';
import {
  reloadJourney,
  exportScriptJourney,
} from './animate-script-journeys.mjs';
import {badgesJourney} from './animate-script-badges.mjs';

export function animateTimelineCases({fresh, out}) {
  const journey = createTimelineJourney({fresh, out});
  const tabs = journey(
    'animate-tabs-timeline',
    async ({page, holds, count, editor, screenshot}) => {
      await count(1);
      assert.equal(
        await page.locator('[data-bar-mode="transport"]').count(),
        1,
      );
      assert.equal(
        await page
          .locator('[data-animate-toggle]')
          .getAttribute('aria-pressed'),
        'true',
      );
      const counts = [];
      for (let n = 1; n <= 3; n++) {
        if (n > 1) {
          await page
            .locator('[data-timeline] [data-animation-add-tab]')
            .click();
          await editor().fill(`const tab${n} = ${n};`);
        }
        await count(n);
        counts.push(await holds().count());
        await screenshot(`${n}-tabs`);
        await page.locator('[data-animate-toggle]').click();
        await page.locator('[data-animate-toggle]').click();
        await count(n);
      }
      await page
        .locator('[data-timeline-layout-toggle]')
        .getByRole('tab')
        .nth(1)
        .click();
      await page.locator('[data-timeline="outline"]').waitFor();
      await count(3);
      await screenshot('list');
      await page
        .locator('[data-timeline-layout-toggle]')
        .getByRole('tab')
        .first()
        .click();
      await page.locator('[data-timeline="filmstrip"]').waitFor();
      return {counts, layouts: ['filmstrip', 'outline']};
    },
  );
  const script = scriptJourney(journey);
  const transition = journey(
    'animate-transition-popover',
    async ({page, chips, addStep, screenshot}) => {
      await addStep();
      const chip = chips().first();
      for (const key of ['Enter', 'Space']) {
        await chip.focus();
        await chip.press(key);
        const popover = page.getByRole('dialog', {name: 'Easing', exact: true});
        await popover.waitFor();
        await screenshot(key.toLowerCase());
        await page.keyboard.press('Escape');
        await popover.waitFor({state: 'hidden'});
        await page.waitForFunction(() =>
          document.activeElement?.matches(
            '[data-animation-segment][data-kind="transition"]',
          ),
        );
        assert.equal(
          await chip.evaluate(element => element === document.activeElement),
          true,
        );
      }
      return {keys: ['Enter', 'Space'], focusReturned: true};
    },
  );
  const done = journey('animate-mode-done', async ({page}) => {
    await page.locator('[data-animate-mode]').waitFor();
    await page.locator('[data-animate-done]').click();
    await page.locator('[data-animate-panel]').waitFor({state: 'hidden'});
    assert.equal(
      await page.locator('[data-animate-toggle]').getAttribute('aria-pressed'),
      'false',
    );
    await page.locator('[data-animate-toggle]').focus();
    await page.locator('[data-animate-toggle]').press('Enter');
    await page.locator('[data-animate-mode]').waitFor();
    await page.locator('[data-animate-toggle]').press('Escape');
    await page.locator('[data-animate-panel]').waitFor({state: 'hidden'});
    return {done: true, escape: true};
  });
  const reload = reloadJourney(journey, out);
  const phone = journey(
    'animate-phone-timeline',
    async ({page, holds, count, screenshot}) => {
      await page.locator('[data-timeline="outline"]').waitFor();
      await count(1);
      assert.equal(
        await page.locator('[data-timeline="filmstrip"]').count(),
        0,
      );
      await holds().first().click();
      const sheet = page.locator('[data-animation-step-sheet]');
      await sheet.waitFor();
      await screenshot('sheet');
      await sheet
        .getByRole('button', {name: 'Close step settings', exact: true})
        .click();
      await sheet.waitFor({state: 'hidden'});
      return {layout: 'outline', sheet: true};
    },
    {width: 390, height: 844},
  );
  const exportScript = exportScriptJourney(journey, out);
  return [
    ['animate-tabs-timeline', tabs],
    ['animate-script-editing', script],
    ['animate-transition-popover', transition],
    ['animate-mode-done', done],
    ['animate-script-reload', reload],
    ['animate-phone-timeline', phone],
    ['animate-script-export', exportScript],
    ['animate-script-badges', badgesJourney(journey)],
    ['animate', tabs],
    ['animate-phone', phone],
    ['animate-focus', transition],
    ['animate-geometry', tabs],
    ['animate-followups', script],
  ];
}

function scriptJourney(journey) {
  return journey(
    'animate-script-editing',
    async ({page, editor, holds, addStep, count, screenshot}) => {
      await addStep();
      await count(2);
      const firstId = await holds().first().getAttribute('data-step-id');
      await editor().focus();
      await page.keyboard.press('ControlOrMeta+Home');
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('Shift+ArrowDown');
      await page.locator('[data-script-action="enter"]').click();
      await page.locator('[data-animate-aid="line"]').first().waitFor();
      await screenshot('enter');
      await addStep();
      await count(3);
      const lastId = await holds().last().getAttribute('data-step-id');
      await holds().nth(1).click();
      await page.locator('[data-step-menu]').click();
      await screenshot('menu');
      await page.locator('[data-script-remove]').click();
      await count(2);
      assert.deepEqual(
        await holds().evaluateAll(items =>
          items.map(item => item.dataset.stepId),
        ),
        [firstId, lastId],
      );
      assert.equal(
        await holds().first().getAttribute('aria-pressed'),
        'true',
        'selection follows the surviving previous id',
      );
      return {firstId, lastId, removedMiddle: true};
    },
  );
}
