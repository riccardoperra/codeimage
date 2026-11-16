import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';

const keys = ['Enter', 'Space', 'ArrowDown'];
const triggers =
  'button[aria-haspopup="true"], button[aria-haspopup="menu"], button[aria-haspopup="listbox"], [role="combobox"]';

// The deadline runs in Node, outside the renderer that the regression locks up.
async function watchdog(page, label, action) {
  const session = await page.context().newCDPSession(page);
  let timer;
  try {
    return await Promise.race([
      action(),
      new Promise((_, reject) => {
        timer = setTimeout(() => {
          void session.send('Runtime.terminateExecution').catch(() => {});
          reject(new Error(`Keyboard watchdog: ${label} exceeded 5 seconds`));
        }, 5000);
      }),
    ]);
  } finally {
    clearTimeout(timer);
    await session.detach().catch(() => {});
  }
}

export async function verifyKeyboardScroll({fresh, out}) {
  const records = [];
  const evidence = resolve(out, 'keyboard-scroll.json');
  for (const layout of ['inspector', 'dock', 'studio']) {
    for (const viewport of [
      {width: 1440, height: 900},
      {width: 390, height: 844},
    ]) {
      const name = `keyboard-scroll-${layout}-${viewport.width}`;
      await fresh({name, layout, viewport}, async ({page, doctor, editor}) => {
        await doctor();
        assert.equal(
          await page.evaluate(
            () => getComputedStyle(document.scrollingElement).overflow,
          ),
          'hidden',
        );
        const signature = async () => {
          await page
            .getByPlaceholder('@handle or profile link', {exact: true})
            .fill('@keyboard');
          await page
            .locator('[data-control="signature.style"]')
            .getByRole('tab', {name: 'Card', exact: true})
            .click();
          await page
            .locator('[data-control="signature.avatar"]')
            .getByRole('tab', {name: 'Profile', exact: true})
            .click();
        };
        const sweep = async scene => {
          await page.evaluate(async () => {
            await new Promise(resolve =>
              requestAnimationFrame(() => requestAnimationFrame(resolve)),
            );
            const animations = [
              ...document.querySelectorAll(
                '[data-control-panel], [data-control-overlay], [data-panel][role]',
              ),
            ].flatMap(element => element.getAnimations({subtree: true}));
            await Promise.allSettled(
              animations
                .filter(
                  animation =>
                    animation.effect?.getComputedTiming().iterations !==
                    Infinity,
                )
                .map(animation => animation.finished),
            );
          });
          await page
            .locator('[data-verify-keyboard]')
            .evaluateAll(elements =>
              elements.forEach(element =>
                element.removeAttribute('data-verify-keyboard'),
              ),
            );
          const found = await page.locator(triggers).evaluateAll(elements => {
            const overlay = document.querySelector('[data-control-overlay]');
            return elements.flatMap((element, index) => {
              if (
                !element.checkVisibility({
                  checkOpacity: true,
                  checkVisibilityCSS: true,
                }) ||
                element.matches(':disabled') ||
                element.getAttribute('aria-disabled') === 'true'
              )
                return [];
              if (overlay && !overlay.contains(element)) return [];
              if (element.closest('[data-section]:not([data-open])')) return [];
              if (
                !element.closest(
                  '[data-control-panel], [data-control-overlay], :is([role="dialog"], [role="alertdialog"])[data-panel]',
                )
              )
                return [];
              const ancestors = [];
              for (
                let parent = element.parentElement;
                parent && parent !== document.scrollingElement;
                parent = parent.parentElement
              ) {
                const css = getComputedStyle(parent);
                if (
                  /(auto|scroll)/.test(
                    css.overflow + css.overflowX + css.overflowY,
                  )
                )
                  ancestors.push({
                    tag: parent.tagName,
                    class: parent.className,
                    overflowing:
                      parent.scrollHeight > parent.clientHeight ||
                      parent.scrollWidth > parent.clientWidth,
                  });
              }
              if (!ancestors.length) return [];
              element.setAttribute('data-verify-keyboard', String(index));
              return [
                {
                  index,
                  label:
                    element.getAttribute('aria-label') ||
                    element.textContent.trim(),
                  control: element
                    .closest('[data-control]')
                    ?.getAttribute('data-control'),
                  popup: element.getAttribute('aria-haspopup'),
                  ancestors,
                },
              ];
            });
          });
          for (const description of found) {
            const trigger = page.locator(
              `[data-verify-keyboard="${description.index}"]`,
            );
            for (const key of keys) {
              const record = {
                layout,
                viewport,
                scene,
                ...description,
                key,
                status: 'running',
              };
              records.push(record);
              await writeFile(evidence, JSON.stringify(records, null, 2));
              try {
                await watchdog(
                  page,
                  `${name}/${scene}/${description.label}/${key}`,
                  async () => {
                    await trigger.scrollIntoViewIfNeeded();
                    await trigger.focus();
                    assert.ok(
                      await trigger.evaluate(
                        element => element === document.activeElement,
                      ),
                      `${description.label}: trigger receives focus`,
                    );
                    await page.keyboard.press(key);
                    await page
                      .getByRole(
                        ['true', 'menu'].includes(description.popup)
                          ? 'menu'
                          : 'listbox',
                      )
                      .last()
                      .waitFor({state: 'visible'});
                    assert.equal(
                      await trigger.getAttribute('aria-expanded'),
                      'true',
                    );
                    // A frame and an evaluation after keydown prove the renderer responds.
                    await page.evaluate(
                      () =>
                        new Promise(resolve =>
                          requestAnimationFrame(() => resolve(true)),
                        ),
                    );
                    await page.keyboard.press('Escape');
                    assert.equal(
                      await trigger.getAttribute('aria-expanded'),
                      'false',
                    );
                    await page.waitForFunction(
                      index =>
                        document.querySelector(
                          `[data-verify-keyboard="${index}"]`,
                        ) === document.activeElement,
                      description.index,
                    );
                  },
                );
                record.status = 'passed';
              } catch (error) {
                record.status = 'failed';
                record.error = String(error);
                throw error;
              } finally {
                await writeFile(evidence, JSON.stringify(records, null, 2));
              }
            }
          }
        };
        if (layout === 'dock') {
          await page.locator('[data-control-dock] [data-panel="more"]').click();
          for (const group of ['Frame', 'Signature', 'Window', 'Code']) {
            await page.getByRole('tab', {name: group, exact: true}).click();
            if (group === 'Signature') await signature();
            await sweep(`More/${group}`);
          }
          await page.keyboard.press('Escape');
          await page.locator('[data-control-dock] [data-panel="font"]').click();
          await sweep('Font');
          await page.keyboard.press('Escape');
          if (viewport.width < 768) {
            await page
              .locator('[data-control-dock] [data-panel="language"]')
              .click();
            await sweep('Language');
          }
        } else {
          if (layout === 'inspector' && viewport.width < 768)
            await page
              .getByRole('button', {name: 'Expand inspector', exact: true})
              .click();
          const open = async (id, label) => {
            const button =
              layout === 'inspector'
                ? page.locator(`[data-section="${id}"] > button`)
                : page.getByRole('button', {name: label, exact: true});
            if ((await button.getAttribute('aria-expanded')) !== 'true')
              await button.click();
          };
          await open('presets', 'Presets');
          await page
            .getByRole('button', {name: 'Add preset', exact: true})
            .first()
            .click();
          const add = page.getByRole('alertdialog', {
            name: 'Add a new preset',
            exact: true,
          });
          await add.getByRole('textbox').fill('Keyboard preset');
          await add.getByRole('button', {name: 'Confirm', exact: true}).click();
          await page
            .getByRole('button', {name: 'Preset menu', exact: true})
            .waitFor();
          await sweep('Presets');
          await open('frame', 'Frame');
          await sweep('Frame');
          await page.locator('#signature-options').click();
          await signature();
          await sweep('Signature');
          await page
            .getByRole('dialog', {name: 'Signature', exact: true})
            .getByRole('button', {name: 'Close', exact: true})
            .click();
          await open('window', 'Window');
          await sweep('Window');
          await open('code', 'Code');
          await sweep('Code');
          assert.ok(
            records.some(
              record =>
                record.layout === layout &&
                record.viewport.width === viewport.width &&
                record.label === 'Preset menu',
            ),
            `${name}: preset regression exercised`,
          );
        }
        for (const label of ['Saved signatures', 'Avatar source'])
          assert.ok(
            records.some(
              record =>
                record.layout === layout &&
                record.viewport.width === viewport.width &&
                record.label === label,
            ),
            `${name}: ${label} exercised`,
          );
        const expected =
          layout === 'dock'
            ? [
                'Saved signatures',
                'Avatar source',
                'Border',
                'Shadow',
                'Syntax theme',
                'Font weight',
              ]
            : [
                'Preset menu',
                'Padding',
                'Saved signatures',
                'Avatar source',
                'Border',
                'Shadow',
                'Language',
                'Theme',
                'Font',
                'Font weight',
              ];
        for (const label of expected)
          for (const key of keys)
            assert.ok(
              records.some(
                record =>
                  record.layout === layout &&
                  record.viewport.width === viewport.width &&
                  record.label === label &&
                  record.key === key &&
                  record.status === 'passed',
              ),
              `${name}: ${label}/${key} covered`,
            );
        await page.screenshot({path: resolve(out, `${name}.png`)});
        await editor().waitFor();
      });
    }
  }
  return {actions: records.length, evidence};
}
