// node apps/codeimage/src/pages/UnifiedEditor/verify-review.mjs <base> <screenshots>
import assert from 'node:assert/strict';
import {mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import {chromium} from 'playwright';
import {PNG} from 'pngjs';
import pixelmatch from 'pixelmatch';
const base = process.argv[2] ?? 'http://localhost:4345';
const out = process.argv[3] ?? '/tmp/codeimage-review-fixes';
mkdirSync(out, {recursive: true});
const platform = process.env.REVIEW_PLATFORM ?? 'MacIntel';
const isApple = /Mac|iPhone|iPad/.test(platform);
const results = [];
const check = (ok, message) => {
  assert(ok, message);
  results.push(message);
  console.log('PASS', message);
};
const source = path => readFileSync(new URL(path, import.meta.url), 'utf8');

async function verifyExportParity(page, tag) {
  await page.evaluate(async () => {
    window.__terminal = (
      await import('/src/state/editor/terminal.ts')
    ).getTerminalState();
  });
  await page.evaluate(() => document.fonts.ready);
  for (const tabs of [1, 2]) {
    if (tabs === 2)
      await page.evaluate(() =>
        window.__editor.actions.addEditor(
          {code: '', tab: {tabName: 'second.ts'}},
          true,
        ),
      );
    await page
      .locator('.cm-content[contenteditable=true]')
      .fill('const message = "CodeImage parity";\nconsole.log(message);');
    for (const header of [true, false]) {
      await page.evaluate(
        value => window.__terminal.setShowHeader(value),
        header,
      );
      await page.locator('[data-export-image]').hover();
      await page.locator('[data-export-image]').focus();
      await page.waitForTimeout(350);
      const live = page
        .locator('[data-fit-scale] [data-frame-content]')
        .locator('..');
      const box = await live.boundingBox();
      const watermarkDelta = await page.evaluate(() => {
        const live = document.querySelector(
          '[data-fit-scale] [data-frame-content]',
        ).parentElement;
        const copy = document.querySelector(
          '[class*=Frame_previewWrapper] > div',
        );
        const measure = root => {
          const box = root.getBoundingClientRect();
          const mark = root
            .querySelector('[class*=terminal_watermark]')
            .getBoundingClientRect();
          return {y: mark.y - box.y, height: mark.height};
        };
        const a = measure(live),
          b = measure(copy);
        return Math.max(Math.abs(a.y - b.y), Math.abs(a.height - b.height));
      });
      check(
        watermarkDelta < 1,
        `${tag}: live/export watermark geometry differs by ${watermarkDelta.toFixed(3)}px`,
      );
      check(
        (await page
          .locator('[data-fit-scale]')
          .getAttribute('data-fit-scale')) === '1',
        `${tag}: live/export parity is measured at zoom 1`,
      );
      // Put the live origin on a device pixel without transforming its text.
      // Locator screenshots otherwise include an extra row/column at fractional origins.
      await live.evaluate(element => {
        const box = element.getBoundingClientRect();
        element.style.left = `${Math.round(box.x) - box.x}px`;
        element.style.top = `${Math.round(box.y) - box.y}px`;
        element.style.width = getComputedStyle(element).width;
      });
      const name = `${out}/${tag}-${tabs}-tabs-header-${header}`;
      const screenshot = await page.screenshot({
        path: `${name}-live.png`,
        clip: {
          x: Math.round(box.x),
          y: Math.round(box.y),
          width: Math.round(box.width),
          height: Math.round(box.height),
        },
        style:
          '[data-export-exclude=true], .cm-cursorLayer, .cm-selectionLayer {display:none !important}',
      });
      await live.evaluate(element => {
        element.style.removeProperty('left');
        element.style.removeProperty('top');
        element.style.removeProperty('width');
      });
      const pending = page.waitForEvent('download');
      await page.locator('[data-export-image]').click();
      const download = await pending;
      await download.saveAs(`${name}-export.png`);
      const actual = PNG.sync.read(readFileSync(`${name}-export.png`));
      const expected = PNG.sync.read(screenshot);
      assert.equal(actual.width, expected.width, `${name}: exported width`);
      assert.equal(actual.height, expected.height, `${name}: exported height`);
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
      writeFileSync(`${name}-diff.png`, PNG.sync.write(diff));
      check(
        percent <= 0.5,
        `${tag}: ${tabs} tabs, header ${header}: ${actual.width}x${actual.height}, ${percent.toFixed(3)}% live/export difference`,
      );
    }
  }
  await page.evaluate(() => {
    const editor = window.__editor;
    editor.actions.removeEditor(editor.state.editors[1].id);
    window.__terminal.setShowHeader(true);
  });
}
check(
  !source('./command-menu/state.ts').includes('setReveal'),
  '6: dead reveal registration removed',
);
check(
  !source('./shell/export.tsx').includes('createMemo'),
  '6: secrets count is lazy',
);
check(
  source('./model.tsx').includes('if (!getExportTarget(ratio))'),
  '6: target changes skip ratio analytics',
);
check(
  source('./controls/mark-toolbar.ts').includes('placement.get(view.state)'),
  '6: tooltip configuration is installed once per view',
);
check(
  !source('./controls/ShortcutHelp.tsx').includes('<KeyboardShortcuts') &&
    !source('./controls/shortcut-help.css.ts').includes('!important'),
  '4: help has no hidden production trigger or forced styles',
);
const browser = await chromium.launch();
try {
  for (const layout of ['inspector', 'dock', 'studio'])
    for (const width of [1440, 390]) {
      if (process.env.REVIEW_LAYOUT && layout !== process.env.REVIEW_LAYOUT)
        continue;
      if (
        process.env.REVIEW_WIDTH &&
        width !== Number(process.env.REVIEW_WIDTH)
      )
        continue;
      const tag = `${platform}-${layout}-${width}`;
      const ctx = await browser.newContext({
        viewport: {width, height: width === 390 ? 844 : 900},
        userAgent: isApple
          ? 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
          : 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        permissions: ['clipboard-read', 'clipboard-write'],
      });
      const page = await ctx.newPage();
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      let outputs = 0;
      page.on('download', () => outputs++);
      page.on('popup', popup => {
        outputs++;
        void popup.close();
      });
      await page.addInitScript(
        ({layout, platform}) => {
          Object.defineProperty(navigator, 'platform', {value: platform});
          window.__keyResults = [];
          window.addEventListener(
            'keydown',
            event => {
              window.__keyResults.push(event);
            },
            true,
          );
          localStorage.setItem(
            'codeimage:editor-settings',
            JSON.stringify({layout}),
          );
          localStorage.setItem(
            '@store/ui',
            JSON.stringify({themeMode: 'dark', locale: 'en'}),
          );
          window.__focus = [];
          document.addEventListener('focusin', event =>
            window.__focus.push({
              time: performance.now(),
              html: event.target.outerHTML?.slice(0, 400),
            }),
          );
          window.__events = [];
          window.umami = {
            track: (name, data) => window.__events.push({name, data}),
          };
          Object.defineProperty(navigator, 'share', {
            configurable: true,
            value: async () => {
              window.__shared = true;
            },
          });
          Object.defineProperty(navigator, 'canShare', {
            configurable: true,
            value: () => true,
          });
        },
        {layout, platform},
      );
      await page.goto(`${base}/`);
      await page.reload();
      await page.waitForSelector('[data-fit-scale] .cm-content');
      const nudge = page.locator('[data-whats-new=nudge]');
      await nudge.waitFor();
      await nudge.getByRole('button', {name: "Dismiss what's new"}).click();
      await nudge.waitFor({state: 'hidden'});
      await page
        .getByRole('button', {name: /^close$/i})
        .first()
        .click({timeout: 3000})
        .catch(() => {});
      await page.evaluate(async () => {
        window.__editor = (
          await import('/src/state/editor/index.ts')
        ).getRootEditorStore();
        window.__frame = (
          await import('/src/state/editor/frame.ts')
        ).getFrameState();
        window.__overlay = (
          await import('/src/pages/UnifiedEditor/controls/ControlOverlay.tsx')
        ).controlOverlay;
        window.__assets = (
          await import('/src/state/assets/assets.ts')
        ).getAssetsStore();
        const canvas = (
          await import('/src/state/canvas.ts')
        ).getExportCanvasStore();
        canvas.set('extension', 'png');
        canvas.set('devicePixelRatio', 1);
      });
      if (width === 1440) await verifyExportParity(page, tag);
      await page.evaluate(() => {
        const e = window.__editor;
        const view = e.activeEditorView();
        view.dispatch({
          changes: {
            from: 0,
            to: view.state.doc.length,
            insert: 'const api_key = "active-r4nd0m-K7v9Qp2X";',
          },
        });
        e.actions.addEditor(
          {
            code: 'const api_key = "inactive-8eNz6W1u5H3t";',
            tab: {tabName: 'second.ts'},
          },
          false,
        );
        e.actions.setFocused(false);
        document.activeElement?.blur();
      });
      const menu = async () => {
        await page.locator('[data-export-menu]').click();
        await page.getByRole('menu').waitFor();
      };
      const command = async query => {
        await page.keyboard.press(isApple ? 'Meta+k' : 'Control+k');
        const input = page.getByRole('combobox', {
          name: 'Search themes and options',
        });
        await input.fill(query);
        await input.press('Enter');
      };
      const warning = page.getByRole('alertdialog');
      const review = async (label, action) => {
        const count = outputs;
        await action();
        await warning.waitFor();
        // Finish the previous menu's focus cleanup before closing this dialog.
        await page
          .locator('[data-cui=dropdown-menu-content]')
          .waitFor({state: 'detached'});
        if (label === 'Export button')
          await page.screenshot({path: `${out}/${tag}-secrets.png`});
        check(
          (await warning.innerText()).includes('possible secrets visible'),
          `1 ${tag}: ${label} reviews secrets`,
        );
        await warning.getByRole('button', {name: 'Close', exact: true}).click();
        await warning.waitFor({state: 'detached'});
        await page
          .waitForFunction(
            () => document.activeElement?.matches('[data-export-image]'),
            null,
            {timeout: 5000},
          )
          .catch(async error => {
            console.log(
              'FOCUS FAILURE',
              label,
              await page.evaluate(() => ({
                active: document.activeElement.outerHTML.slice(0, 500),
                focus: window.__focus.slice(-15),
                exports: [
                  ...document.querySelectorAll('[data-export-image]'),
                ].map(e => ({
                  html: e.outerHTML,
                  box: e.getBoundingClientRect().toJSON(),
                })),
                dialogs: [
                  ...document.querySelectorAll(
                    '[role=dialog],[role=alertdialog]',
                  ),
                ].map(e => e.outerHTML.slice(0, 500)),
              })),
            );
            throw error;
          });
        check(
          outputs === count && !(await page.evaluate(() => window.__shared)),
          `5 ${tag}: ${label} cancel exports nothing and restores Export focus`,
        );
      };
      await review('Export button', () =>
        page.locator('[data-export-image]').click(),
      );
      for (const label of [
        'Export image',
        'Export one image per tab',
        'Copy to clipboard',
        'Open in new tab',
        'Share your code',
      ]) {
        await review(`menu ${label}`, async () => {
          await menu();
          await page
            .getByRole('menuitem', {
              name: label,
              exact:
                label !== 'Export image' &&
                label !== 'Export one image per tab',
            })
            .click();
        });
        await review(`command ${label}`, () => command(label));
      }
      const exportCombos = [
        'Control+s',
        'Control+o',
        'Control+c',
        ...(isApple ? ['Meta+s', 'Meta+o', 'Meta+Shift+c'] : []),
      ];
      if (width === 1440) {
        await page.evaluate(() =>
          navigator.clipboard.writeText('review sentinel'),
        );
        for (const shortcut of exportCombos) {
          await review(shortcut, async () => {
            if (shortcut !== 'Control+c')
              await page.locator('.cm-content[contenteditable=true]').click();
            await page.keyboard.press(shortcut);
          });
          check(
            await page.evaluate(
              () => window.__keyResults.at(-1)?.defaultPrevented,
            ),
            `${tag}: ${shortcut} prevents the browser default`,
          );
          check(
            (await page.evaluate(() => navigator.clipboard.readText())) ===
              'review sentinel',
            `${tag}: cancelling ${shortcut} leaves the clipboard unchanged`,
          );
        }
      }
      check(
        (await page
          .getByRole('button', {name: 'Copy to clipboard', exact: true})
          .count()) === 0 &&
          (await page
            .getByRole('button', {name: 'Open in new tab', exact: true})
            .count()) === 0,
        `1 ${tag}: menu owns Copy and Open once`,
      );
      await page.locator('[data-export-image]').click();
      await warning.waitFor();
      await page.keyboard.press('Escape');
      await warning.waitFor({state: 'detached'});
      await page.waitForFunction(() =>
        document.activeElement?.matches('[data-export-image]'),
      );
      check(true, `5 ${tag}: Escape restores Export focus`);
      await page.locator('[data-export-image]').click();
      await warning.waitFor();
      const downloaded = page.waitForEvent('download');
      await warning
        .getByRole('button', {name: 'Export anyway', exact: true})
        .click();
      await warning.waitFor({state: 'detached'});
      await page.waitForFunction(() =>
        document.activeElement?.matches('[data-export-image]'),
      );
      check(true, `5 ${tag}: confirmation restores Export focus`);
      await downloaded;
      await page
        .getByRole('button', {name: 'Copy alt text', exact: true})
        .last()
        .click();
      await page.waitForTimeout(100);
      // Open the normal panel before measuring, so the overlay itself is the only change.
      if (layout === 'studio')
        await page.getByRole('button', {name: 'Frame', exact: true}).click();
      const geometry = () =>
        page.locator('[data-fit-scale]').evaluate(element => ({
          rect: element.getBoundingClientRect().toJSON(),
          transform: getComputedStyle(element).transform,
          scale: element.dataset.fitScale,
        }));
      await page.waitForTimeout(350);
      for (const id of [
        'frame.background',
        'frame.backgroundImage',
        'window.style',
        'frame.aspectRatio',
        'signature',
      ]) {
        const before = await geometry();
        await page.evaluate(id => window.__overlay.open(id), id);
        const overlay = page.locator(`[data-control-overlay="${id}"]`);
        await overlay.waitFor();
        await page.waitForTimeout(120);
        const after = await geometry();
        check(
          JSON.stringify(before) === JSON.stringify(after),
          `2 ${tag}: ${id} leaves frame rectangle and zoom unchanged`,
        );
        check(
          (await overlay.getAttribute('aria-modal')) !== 'true' &&
            (await overlay.evaluate(el => {
              const frame = document
                .querySelector('[data-fit-scale]')
                .getBoundingClientRect();
              return [
                ...document.elementsFromPoint(
                  frame.x + frame.width / 2,
                  frame.y + frame.height / 2,
                ),
              ].every(item => !/backdrop/.test(item.className ?? ''));
            })),
          `2 ${tag}: ${id} has no modal backdrop`,
        );
        if (width === 1440 && layout === 'dock')
          check(
            await overlay.evaluate((element, id) => {
              const group =
                id === 'frame.background' || id === 'frame.backgroundImage'
                  ? 'background'
                  : 'more';
              const button = document
                .querySelector(
                  `[data-control-dock] button[data-panel="${group}"]`,
                )
                .getBoundingClientRect();
              const dock = document
                .querySelector('[data-control-dock]')
                .getBoundingClientRect();
              const box = element.getBoundingClientRect();
              return (
                Math.abs(
                  box.left + box.width / 2 - button.left - button.width / 2,
                ) < 1 && box.bottom <= dock.top
              );
            }, id),
            `2 ${tag}: ${id} anchors above its dock button`,
          );
        if (width === 1440 && layout !== 'dock')
          check(
            await overlay.evaluate(el => {
              const box = el.getBoundingClientRect();
              const panel = [
                ...document.querySelectorAll('[data-control-panel]'),
              ]
                .find(p => p.getClientRects().length)
                ?.getBoundingClientRect();
              return (
                panel &&
                box.left >= panel.left - 1 &&
                box.right <= panel.right + 1
              );
            }),
            `2 ${tag}: ${id} stays inside its panel`,
          );
        await overlay.getByRole('button', {name: 'Close', exact: true}).click();
        await overlay.waitFor({state: 'detached'});
        await page.waitForTimeout(80);
      }
      if (layout === 'studio') {
        await page.evaluate(() => window.__frame.setBackground('#123456'));
        const fill = page.locator('[data-control="frame.background"] button');
        check(
          (await fill.innerText()).includes('#123456') &&
            (await fill.locator('span[style*="background"]').count()) === 1,
          `3 ${tag}: background row shows applied fill and swatch`,
        );
        check(
          (
            await page
              .locator('[data-control="frame.backgroundImage"] button')
              .innerText()
          ).includes('No image'),
          `3 ${tag}: image row names empty value`,
        );
        await page.evaluate(async () => {
          const file = new File(
            [
              '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><rect width="10" height="10" fill="red"/></svg>',
            ],
            'review-image.svg',
            {type: 'image/svg+xml'},
          );
          const asset = await window.__assets.addFile(file, 'frameBackground');
          window.__frame.setBackground(asset.id);
        });
        const image = page.locator(
          '[data-control="frame.backgroundImage"] button',
        );
        check(
          (await image.innerText()).includes('review-image.svg') &&
            (await image.locator('img').count()) === 1,
          `3 ${tag}: image row shows selected name and thumbnail`,
        );
        await page.evaluate(() => window.__frame.setBackground('#123456'));
      }
      await page.locator('[data-shortcut-help] > button').click();
      const help = page.getByRole('dialog');
      await help.waitFor();
      const count = await help.locator('dt').count();
      check(
        count >= 15 && (await help.innerText()).includes('Focus code editor'),
        `4 ${tag}: help renders production shortcut definitions`,
      );
      const helpKeys = async label =>
        help
          .locator('dt')
          .filter({hasText: new RegExp(`^${label}$`)})
          .locator('xpath=following-sibling::dd[1]')
          .locator('kbd')
          .allTextContents();
      for (const [label, keys] of [
        ['Export', [isApple ? '⌘' : 'Ctrl', 'S']],
        ['Export in a new tab', [isApple ? '⌘' : 'Ctrl', 'O']],
        ['Copy snippet', isApple ? ['⌘', 'Shift', 'C'] : ['Ctrl', 'C']],
      ]) {
        assert.deepEqual(await helpKeys(label), keys);
        check(true, `${tag}: help shows ${keys.join('+')} for ${label}`);
      }
      check(
        !(await help
          .locator('dt')
          .filter({hasText: /^Copy link$/})
          .count()) &&
          (await help.locator('kbd').allTextContents()).includes(
            isApple ? '⌥' : 'Alt',
          ),
        `${tag}: help has no stale Copy link row and uses platform line-mark modifiers`,
      );
      await page.keyboard.press('Escape');
      await help.waitFor({state: 'detached'});
      await page.waitForTimeout(80);
      for (let i = 0; i < 3; i++) {
        await command('Keyboard shortcuts');
        await help.waitFor();
        check(
          (await help.locator('dt').count()) === count,
          `4 ${tag}: help command opens one stable list ${i + 1}`,
        );
        await help.getByRole('button', {name: 'Close', exact: true}).click();
        await help.waitFor({state: 'detached'});
        await page.waitForTimeout(80);
      }
      await page.locator('[data-export-image]').focus();
      await page.keyboard.press('?');
      await help.waitFor();
      await page.keyboard.press('Escape');
      await help.waitFor({state: 'detached'});
      await page.waitForTimeout(80);
      check(
        await page
          .locator('[data-shortcut-help] > button')
          .evaluate(el => el === document.activeElement),
        `4 ${tag}: question mark and Escape restore help focus`,
      );
      await page.evaluate(() => {
        window.__events = [];
      });
      await command('Aspect ratio: Square');
      check(
        await page.evaluate(
          () =>
            window.__frame.store.exportTarget === 'square' &&
            window.__events.every(event => event.name !== 'aspect-ratio'),
        ),
        `6 ${tag}: choosing a social target emits no ratio event`,
      );
      await page.evaluate(() => window.__frame.setExportTarget(null));
      // Opening a picker through the visible row uses the same overlay.
      if (layout === 'studio') {
        await page.locator('[data-control="frame.background"] button').click();
        await page.locator('[data-control-overlay]').waitFor();
        await page.keyboard.press('Escape');
      }
      check(
        errors.filter(error => !error.includes("reading 'url'")).length === 0,
        `${tag}: no unexpected page errors: ${errors.join('; ')}`,
      );
      if (width === 1440) {
        // Clear the inactive tab's secret fixture; drive the active editor through its UI.
        await page.evaluate(() => {
          window.__editor.state.editors.forEach((_, index) => {
            window.__editor.actions.setEditors(
              index,
              'code',
              'const secondary = 2;',
            );
          });
        });
        const editor = page.locator('.cm-content[contenteditable=true]');
        await editor.fill('const shortcut = "text copy";');
        await page.keyboard.press('End');
        await page.keyboard.type('soc');
        check(
          (await editor.innerText()).endsWith('soc'),
          `${tag}: typing s, o and c in CodeMirror stays text`,
        );
        if (isApple) {
          await page.keyboard.press('Meta+a');
          await page.keyboard.press('Meta+c');
          check(
            (await page.evaluate(() => navigator.clipboard.readText())) ===
              (await editor.innerText()),
            `${tag}: Cmd+C copies the selected code as text`,
          );
        }
        await page.evaluate(() =>
          navigator.clipboard.writeText('field copy sentinel'),
        );
        await page.keyboard.press('Control+c');
        check(
          !(await page.evaluate(
            () => window.__keyResults.at(-1)?.defaultPrevented,
          )) && !(await warning.count()),
          `${tag}: Control+C in CodeMirror is not taken by image export`,
        );
        for (const shortcut of exportCombos) {
          if (shortcut === 'Control+c') {
            await page.keyboard.press('Escape');
            await page.locator('[data-export-image]').focus();
            await page.waitForFunction(
              () => !window.__editor.state.options.focused,
            );
          } else {
            await editor.click();
          }
          if (shortcut.endsWith('+s')) {
            const download = page.waitForEvent('download');
            await page.keyboard.press(shortcut);
            const file = await download;
            check(
              file.suggestedFilename().endsWith('.png') &&
                !(await file.failure()),
              `${tag}: ${shortcut} downloads the image`,
            );
          } else if (shortcut.endsWith('+o')) {
            const popup = page.waitForEvent('popup');
            await page.keyboard.press(shortcut);
            await popup;
            check(true, `${tag}: ${shortcut} opens an image tab`);
          } else {
            await page.evaluate(() =>
              navigator.clipboard.writeText('image copy sentinel'),
            );
            await page.keyboard.press(shortcut);
            let imageSize = 0;
            for (let attempt = 0; attempt < 100 && !imageSize; attempt++) {
              imageSize = await page.evaluate(async () => {
                const items = await navigator.clipboard.read();
                const item = items.find(item =>
                  item.types.includes('image/png'),
                );
                return item ? (await item.getType('image/png')).size : 0;
              });
              if (!imageSize) await page.waitForTimeout(100);
            }
            if (!imageSize)
              console.log(
                'CLIPBOARD FAILURE',
                await page.evaluate(() => ({
                  active: document.activeElement?.outerHTML.slice(0, 300),
                  focused: window.__editor.state.options.focused,
                  documentFocused: document.hasFocus(),
                  prevented: window.__keyResults.at(-1)?.defaultPrevented,
                  loading: document
                    .querySelector('[data-export-image]')
                    ?.hasAttribute('data-loading'),
                  text: document.body.innerText.slice(-1000),
                })),
              );
            check(
              imageSize > 0,
              `${tag}: ${shortcut} writes a PNG to the clipboard`,
            );
          }
          check(
            !(await warning.count()),
            `${tag}: ${shortcut} exports without a secrets review when code is safe`,
          );
          await page
            .getByRole('button', {name: 'Copy alt text', exact: true})
            .last()
            .waitFor();
          // Copy uses a separate loading signal; wait for the user-visible spinner to finish.
          await page.waitForFunction(
            () => !document.querySelector('[data-export-image][data-loading]'),
          );
        }
        if (!isApple) {
          await page.locator('[data-export-image]').focus();
          const count = outputs;
          await page.evaluate(() =>
            navigator.clipboard.writeText('non-Mac sentinel'),
          );
          for (const shortcut of ['Meta+s', 'Meta+o', 'Meta+Shift+c']) {
            await page.keyboard.press(shortcut);
            check(
              !(await page.evaluate(
                () => window.__keyResults.at(-1)?.defaultPrevented,
              )),
              `${tag}: ${shortcut} is not bound outside Apple platforms`,
            );
          }
          check(
            outputs === count &&
              (await page.evaluate(() => navigator.clipboard.readText())) ===
                'non-Mac sentinel',
            `${tag}: Meta combos produce no export on the non-Mac branch`,
          );
        }
      }
      await page.waitForTimeout(350);
      await page.reload();
      await page.waitForSelector('[data-fit-scale] .cm-content');
      await page.screenshot({path: `${out}/${tag}.png`});
      await page.reload();
      await page.waitForSelector('[data-fit-scale] .cm-content');
      await command('Background…');
      await page.locator('[data-control-overlay="frame.background"]').waitFor();
      await page.screenshot({path: `${out}/${tag}-overlay.png`});
      await ctx.close();
    }
} finally {
  await browser.close();
  writeFileSync(`${out}/checks.json`, JSON.stringify(results, null, 2));
}
