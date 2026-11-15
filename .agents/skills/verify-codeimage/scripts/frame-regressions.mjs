import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {PNG} from 'pngjs';
import pixelmatch from 'pixelmatch';

const layouts = ['inspector', 'dock', 'studio'];
const viewports = [
  {width: 1440, height: 900},
  {width: 390, height: 844},
];

export async function verifyColdStart({fresh, out}) {
  const stress = process.env.VERIFY_COLD_START_STRESS === '1';
  const records = [];
  for (const layout of layouts)
    for (const viewport of viewports)
      for (let start = 0; start < (stress ? 20 : 2); start++) {
        const delayed = start % 2 === 1;
        const name = `frame-cold-start-${layout}-${viewport.width}-${start + 1}`;
        let modules = 0,
          inputs = 0;
        const routeErrors = [];
        await fresh(
          {
            name,
            layout,
            viewport,
            initialize: async (context, page) => {
              await context.addInitScript(() => {
                window.__frameSamples = JSON.parse(
                  sessionStorage.getItem('verify:frame-samples') ?? '[]',
                );
                window.addEventListener('beforeunload', () =>
                  sessionStorage.setItem(
                    'verify:frame-samples',
                    JSON.stringify(window.__frameSamples),
                  ),
                );
                const measure = element => {
                  if (!element) return null;
                  const surface =
                    element.querySelector('[data-frame-content]') ??
                    element.firstElementChild ??
                    element;
                  let painted =
                    getComputedStyle(surface).visibility !== 'hidden';
                  for (
                    let parent = element;
                    parent;
                    parent = parent.parentElement
                  ) {
                    const css = getComputedStyle(parent);
                    if (css.opacity === '0' || css.display === 'none')
                      painted = false;
                  }
                  const box = element.getBoundingClientRect();
                  const tabs = [
                    ...element.querySelectorAll(
                      '[data-host-index][data-active]',
                    ),
                  ];
                  return {
                    box: {
                      x: box.x,
                      y: box.y,
                      width: box.width,
                      height: box.height,
                    },
                    painted,
                    tabs: tabs.map(
                      tab =>
                        tab.querySelector('input')?.value ?? tab.textContent,
                    ),
                    input: !!element.querySelector(
                      '[aria-label="Tab name"] input',
                    ),
                    header: element
                      .querySelector('[data-header-visible]')
                      ?.getAttribute('data-header-visible'),
                  };
                };
                const sample = time => {
                  window.__frameSamples.push({
                    time,
                    placeholder: measure(
                      document.querySelector('[data-frame-placeholder]'),
                    ),
                    frame: measure(
                      document.querySelector(
                        '[data-fit-scale] [data-frame-content]',
                      )?.parentElement,
                    ),
                  });
                  window.__frameRAF = requestAnimationFrame(sample);
                };
                window.__frameRAF = requestAnimationFrame(sample);
              });
              if (delayed) {
                await context.route(
                  '**/components/Frame/ManagedFrame.tsx*',
                  async route => {
                    modules++;
                    await new Promise(resolve => setTimeout(resolve, 600));
                    await route.continue();
                  },
                );
                await context.route(
                  '**/Tabs/TabName/TabName.tsx*',
                  async route => {
                    inputs++;
                    await page
                      .waitForFunction(
                        () =>
                          window.__frameSamples.some(
                            sample =>
                              sample.frame?.painted && !sample.frame.input,
                          ),
                        null,
                        {timeout: 15000},
                      )
                      .catch(error => routeErrors.push(String(error)));
                    await route.continue();
                  },
                );
              }
            },
          },
          async ({page, doctor}) => {
            await doctor();
            await page
              .locator('[data-fit-scale] [aria-label="Tab name"] input')
              .waitFor();
            assert.deepEqual(
              routeErrors,
              [],
              `${name}: delayed label fallback painted`,
            );
            await page.mouse.move(0, 0);
            await page.waitForFunction(
              rest => {
                if (
                  !document.querySelector(
                    '[data-fit-scale] .cm-content[contenteditable=true]',
                  ) ||
                  document.fonts.status !== 'loaded'
                ) {
                  window.__frameReadyAt = undefined;
                  return false;
                }
                window.__frameReadyAt ??= performance.now();
                return performance.now() - window.__frameReadyAt >= rest;
              },
              stress ? 2000 : 500,
            );
            const samples = await page.evaluate(() => {
              cancelAnimationFrame(window.__frameRAF);
              return window.__frameSamples;
            });
            await writeFile(
              resolve(out, `${name}.json`),
              JSON.stringify(samples),
            );
            const final = samples.at(-1).frame;
            assert.ok(final?.painted, `${name}: live frame is painted at rest`);
            assert.deepEqual(
              final.tabs,
              ['index.tsx'],
              `${name}: complete tab label at rest`,
            );
            let maxDrift = 0,
              placeholders = 0,
              frames = 0,
              fallbackLabels = 0;
            for (const sample of samples)
              for (const kind of ['placeholder', 'frame']) {
                const item = sample[kind];
                if (!item?.painted || !item.box.width || !item.box.height)
                  continue;
                for (const key of ['x', 'y', 'width', 'height'])
                  maxDrift = Math.max(
                    maxDrift,
                    Math.abs(item.box[key] - final.box[key]),
                  );
                if (kind === 'placeholder') placeholders++;
                else {
                  frames++;
                  assert.deepEqual(
                    item.tabs,
                    final.tabs,
                    `${name}: tab label disappears during lazy load`,
                  );
                  assert.equal(
                    item.header,
                    final.header,
                    `${name}: intermediate window header`,
                  );
                  if (!item.input) fallbackLabels++;
                }
              }
            const record = {
              layout,
              viewport,
              delayed,
              samples: samples.length,
              placeholders,
              frames,
              fallbackLabels,
              modules,
              inputs,
              maxDrift,
            };
            records.push(record);
            await writeFile(
              resolve(out, 'frame-cold-start.json'),
              JSON.stringify(records, null, 2),
            );
            console.log(
              `${name}: ${samples.length} rAF samples, drift ${maxDrift.toFixed(3)}px, ${fallbackLabels} lazy-label frames`,
            );
            assert.ok(
              frames > 0 && maxDrift <= 1,
              `${name}: maximum drift ${maxDrift.toFixed(3)}px exceeds 1px`,
            );
            if (delayed) {
              assert.ok(
                modules > 0 && inputs > 0,
                `${name}: both module routes exercised`,
              );
              assert.ok(
                placeholders > 0 && fallbackLabels > 0,
                `${name}: painted placeholder and lazy label observed`,
              );
            }
            await page.screenshot({path: resolve(out, `${name}.png`)});
          },
        );
      }
  return {
    starts: records.length,
    samples: records.reduce((n, r) => n + r.samples, 0),
    maxDrift: Math.max(...records.map(r => r.maxDrift)),
  };
}

export async function verifyExportScreen({fresh, out}) {
  const records = [];
  for (const layout of layouts) {
    await fresh(
      {name: `export-screen-${layout}`, layout, viewport: viewports[0]},
      async ({page, doctor, editor, settings, closeSettings, download}) => {
        await doctor();
        await settings('export');
        await page
          .locator('[data-setting=export-format]')
          .getByRole('tab', {name: 'PNG', exact: true})
          .click();
        await page
          .locator('[data-setting=export-scale]')
          .getByRole('tab', {name: '1x', exact: true})
          .click();
        await closeSettings();
        const header = async visible => {
          if (
            (await page
              .locator('[data-fit-scale] [data-header-visible]')
              .getAttribute('data-header-visible')) === String(visible)
          )
            return;
          await page.keyboard.press('ControlOrMeta+k');
          const input = page.getByRole('combobox', {
            name: 'Search themes and options',
            exact: true,
          });
          await input.fill('Toggle Header');
          await input.press('Enter');
          await page
            .locator('[data-command-menu]')
            .waitFor({state: 'detached'});
          assert.equal(
            await page
              .locator('[data-fit-scale] [data-header-visible]')
              .getAttribute('data-header-visible'),
            String(visible),
          );
        };
        for (const tabs of [1, 2]) {
          await header(true);
          if (tabs === 2)
            await page
              .locator('[data-fit-scale] button[data-export-exclude=true]')
              .first()
              .click();
          await page
            .locator('[data-fit-scale] [aria-label="Tab name"] input')
            .fill(tabs === 1 ? 'first.ts' : 'second.ts');
          await page.keyboard.press('Escape');
          assert.equal(
            await page
              .locator('[data-fit-scale] [data-host-index][data-active]')
              .count(),
            tabs,
            'named tab count',
          );
          await editor().fill('const a = 1;\na();\n');
          for (const visible of [true, false]) {
            await header(visible);
            await page.locator('[data-export-image]').hover();
            await page.locator('[data-export-image]').focus();
            await page.waitForTimeout(350);
            assert.equal(
              await page
                .locator('[data-fit-scale]')
                .getAttribute('data-fit-scale'),
              '1',
              'live frame zoom 1',
            );
            const geometry = await page.evaluate(() => {
              const live = document.querySelector(
                '[data-fit-scale] [data-frame-content]',
              ).parentElement;
              const copy = document.querySelector(
                '[class*=Frame_previewWrapper] > [data-watermark-frame]',
              );
              const read = root => {
                const box = root.getBoundingClientRect();
                const mark = root
                  .querySelector(
                    '[data-watermark-moved] svg, [data-watermark-home] svg',
                  )
                  .getBoundingClientRect();
                return {
                  width: box.width,
                  height: box.height,
                  watermark: {
                    x: mark.x - box.x,
                    y: mark.y - box.y,
                    width: mark.width,
                    height: mark.height,
                  },
                  slot: root.querySelector('[data-watermark-home]').dataset
                    .watermarkPlacement,
                };
              };
              return {live: read(live), copy: read(copy)};
            });
            const watermarkDelta = Math.max(
              ...['x', 'y', 'width', 'height'].map(key =>
                Math.abs(
                  geometry.live.watermark[key] - geometry.copy.watermark[key],
                ),
              ),
            );
            const name = `export-screen-${layout}-${tabs}-header-${visible}`;
            const live = page
              .locator('[data-fit-scale] [data-frame-content]')
              .locator('..');
            const box = await live.boundingBox();
            // Align the capture origin without transforming text; retain the frame's
            // size when removing the editing controls that export excludes.
            await live.evaluate(element => {
              const box = element.getBoundingClientRect();
              element.style.left = `${Math.round(box.x) - box.x}px`;
              element.style.top = `${Math.round(box.y) - box.y}px`;
              element.style.width = getComputedStyle(element).width;
            });
            let screen;
            try {
              screen = await page.screenshot({
                path: resolve(out, `${name}-screen.png`),
                clip: {
                  x: Math.round(box.x),
                  y: Math.round(box.y),
                  width: Math.round(box.width),
                  height: Math.round(box.height),
                },
                style:
                  '[data-export-exclude=true], .cm-cursorLayer, .cm-selectionLayer {display:none !important}',
              });
            } finally {
              await live.evaluate(element => {
                for (const key of ['left', 'top', 'width'])
                  element.style.removeProperty(key);
              });
            }
            const actual = PNG.sync.read(await download(`${name}.png`));
            const expected = PNG.sync.read(screen);
            assert.equal(
              actual.width,
              expected.width,
              `${name}: PNG width matches screen`,
            );
            assert.equal(
              actual.height,
              expected.height,
              `${name}: PNG height matches screen`,
            );
            const diff = new PNG({width: actual.width, height: actual.height});
            const percent =
              (pixelmatch(
                expected.data,
                actual.data,
                diff.data,
                actual.width,
                actual.height,
                {threshold: 0.1},
              ) /
                (actual.width * actual.height)) *
              100;
            await writeFile(
              resolve(out, `${name}-diff.png`),
              PNG.sync.write(diff),
            );
            records.push({
              layout,
              tabs,
              header: visible,
              geometry,
              width: actual.width,
              height: actual.height,
              watermarkDelta,
              percent,
            });
            await writeFile(
              resolve(out, 'export-screen-parity.json'),
              JSON.stringify(records, null, 2),
            );
            console.log(
              `${name}: ${actual.width}x${actual.height}, ${percent.toFixed(3)}% pixels, watermark ${watermarkDelta.toFixed(3)}px`,
            );
            assert.ok(
              watermarkDelta < 1,
              `${name}: watermark offset ${watermarkDelta.toFixed(3)}px exceeds 1px`,
            );
            assert.ok(
              percent <= 0.5,
              `${name}: PNG/screen difference ${percent.toFixed(3)}% exceeds 0.5%`,
            );
          }
        }
      },
    );
  }
  return {
    images: records.length,
    maxPixelDifferencePercent: Math.max(...records.map(r => r.percent)),
    maxWatermarkDelta: Math.max(...records.map(r => r.watermarkDelta)),
  };
}
