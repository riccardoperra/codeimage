// node apps/codeimage/src/prototypes/editor-controls/verify-review.mjs <base> <screenshots>
import assert from 'node:assert/strict';
import {mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import {chromium} from 'playwright';
const base = process.argv[2] ?? 'http://localhost:4345';
const out = process.argv[3] ?? '/tmp/codeimage-review-fixes';
mkdirSync(out, {recursive: true});
const results = [];
const check = (ok, message) => {
  assert(ok, message);
  results.push(message);
  console.log('PASS', message);
};
const source = path => readFileSync(new URL(path, import.meta.url), 'utf8');
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
  for (const [layout, v] of [
    ['inspector', 2],
    ['dock', 3],
    ['studio', 4],
  ])
    for (const width of [1440, 390]) {
      if (process.env.REVIEW_LAYOUT && layout !== process.env.REVIEW_LAYOUT)
        continue;
      if (
        process.env.REVIEW_WIDTH &&
        width !== Number(process.env.REVIEW_WIDTH)
      )
        continue;
      const tag = `${layout}-${width}`;
      const ctx = await browser.newContext({
        viewport: {width, height: width === 390 ? 844 : 900},
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
      await page.addInitScript(() => {
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
      });
      await page.goto(`${base}/prototypes/editor-controls?v=${v}`);
      await page.reload();
      await page.waitForSelector('[data-fit-scale] .cm-content');
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
          await import('/src/prototypes/editor-controls/controls/ControlOverlay.tsx')
        ).controlOverlay;
        window.__assets = (
          await import('/src/state/assets/assets.ts')
        ).getAssetsStore();
        const canvas = (
          await import('/src/state/canvas.ts')
        ).getExportCanvasStore();
        canvas.set('extension', 'png');
        canvas.set('devicePixelRatio', 1);
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
        await page.keyboard.press('Meta+k');
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
      if (width === 1440)
        for (const shortcut of ['Control+s', 'Control+o', 'Control+c'])
          await review(shortcut, () => page.keyboard.press(shortcut));
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
