import {writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {resolve} from 'node:path';

export function createTimelineJourney({fresh, out}) {
  return (name, run, viewport = {width: 1440, height: 1000}) =>
    () =>
      fresh({name, layout: 'inspector', viewport}, async api => {
        const {page, doctor, editor, section} = api;
        page.setDefaultTimeout(15000);
        if (viewport.width < 769)
          await page.setViewportSize({width: 1440, height: 1000});
        await doctor('/', 'editor', 'inspector');
        await section('window');
        await page
          .locator('[data-control="window.style"]')
          .getByRole('button')
          .click();
        await page
          .getByRole('radio', {name: 'Editor', exact: true})
          .press('Space');
        await page
          .getByRole('dialog', {name: 'Window', exact: true})
          .getByRole('button', {name: 'Close', exact: true})
          .click();
        await editor().fill(
          'const first = 1;\nconst added = 2;\nconst total = first + added;\nconsole.log(total);',
        );
        if (viewport.width < 769) await page.setViewportSize(viewport);
        await page.locator('[data-animate-toggle]').click();
        await page.locator('[data-animate-panel]').waitFor();
        const holds = () =>
          page.locator(
            '[data-timeline] [data-animation-segment][data-kind="hold"]',
          );
        const chips = () =>
          page.locator(
            '[data-timeline] [data-animation-segment][data-kind="transition"]',
          );
        const count = async n => {
          await page.waitForFunction(
            n =>
              document.querySelectorAll(
                '[data-timeline] [data-animation-segment][data-kind="hold"]',
              ).length === n,
            n,
          );
          assert.equal(await holds().count(), n);
        };
        const addStep = async () =>
          page
            .locator('[data-tab-group]')
            .first()
            .locator('[data-add-script-step]')
            .click();
        const screenshot = suffix => captureTimeline({page, out, name, suffix});
        const result = await run({
          ...api,
          holds,
          chips,
          count,
          addStep,
          screenshot,
        });
        await screenshot('final');
        return result;
      });
}

async function captureTimeline({page, out, name, suffix}) {
  await page.screenshot({
    path: resolve(out, `${name}-${suffix}.png`),
    fullPage: true,
    animations: 'disabled',
  });
  const styles = await page.evaluate(() => {
    const groups = {
      bar: '[data-bar-mode] button',
      duration: '[data-step-toolbar] input, [data-step-toolbar] label',
      popover:
        '[role="dialog"][aria-label="Easing"], [role="dialog"][aria-label="Easing"] input, [role="dialog"][aria-label="Easing"] label, [role="dialog"][aria-label="Easing"] [role="tab"], [role="dialog"][aria-label="Easing"] svg, [role="dialog"][aria-label="Easing"] button',
      menu: '[data-animation-steps-menu], [data-animation-steps-menu] [role="menuitem"], [data-animation-steps-menu] svg, [data-animation-steps-menu] [role="separator"]',
      list: '[data-timeline="outline"] button',
      aids: '[data-animate-aid]',
    };
    const properties = [
      'width',
      'height',
      'min-height',
      'padding',
      'margin',
      'font-size',
      'font-weight',
      'line-height',
      'border-radius',
      'border-top-width',
      'border-top-color',
      'background-color',
      'color',
      'opacity',
      'gap',
    ];
    return Object.fromEntries(
      Object.entries(groups).map(([key, selector]) => [
        key,
        [...document.querySelectorAll(selector)].map(element => {
          const computed = getComputedStyle(element);
          return {
            tag: element.tagName,
            label: element.getAttribute('aria-label'),
            text: element.textContent,
            styles: Object.fromEntries(
              properties.map(property => [
                property,
                computed.getPropertyValue(property),
              ]),
            ),
          };
        }),
      ]),
    );
  });
  await writeFile(
    resolve(out, `${name}-${suffix}-styles.json`),
    JSON.stringify(styles, null, 2),
  );
}
