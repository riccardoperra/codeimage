// node apps/codeimage/src/pages/UnifiedEditor/verify-snippets.mjs <base> <screenshots>
import assert from 'node:assert/strict';
import {mkdirSync, writeFileSync} from 'node:fs';
import {chromium} from 'playwright';

const base = process.argv[2] ?? 'http://127.0.0.1:4357';
const out = process.argv[3] ?? '/tmp/codeimage-snippets';
mkdirSync(out, {recursive: true});
const results = [];
const check = (ok, message) => {
  assert(ok, message);
  results.push(message);
  console.log('PASS', message);
};
const browser = await chromium.launch();
const frame = page =>
  page.locator('[data-fit-scale] [data-frame-content]').first();
async function ready(page, kind = 'owner') {
  await page.locator(`.unified-editor[data-page-state="${kind}"]`).waitFor();
  await page.locator('[data-fit-scale] .cm-content').waitFor();
  await page.evaluate(async () => {
    await document.fonts.ready;
    window.__editor = (
      await import('/src/state/editor/index.ts')
    ).getRootEditorStore();
    window.__frame = (
      await import('/src/state/editor/frame.ts')
    ).getFrameState();
    window.__db = (await import('/src/mocks/db.ts')).db;
    window.__persist = (await import('/src/mocks/persist.ts')).persistDb;
  });
  await page.waitForTimeout(500);
  const dismiss = page.getByRole('button', {
    name: "Dismiss what's new",
    exact: true,
  });
  if (await dismiss.isVisible()) await dismiss.click();
  const close = page.getByRole('button', {name: /^close$/i}).first();
  if (await close.isVisible()) await close.click();
}
async function command(page, label) {
  await page.keyboard.press('Meta+k');
  const menu = page.locator('[data-command-menu]');
  await menu.waitFor();
  await menu.getByRole('combobox').fill(label);
  await menu.getByRole('option', {name: label, exact: true}).click();
  await menu.waitFor({state: 'hidden'});
}
async function navigate(page, path) {
  await page.evaluate(path => {
    const link = document.createElement('a');
    link.href = path;
    link.textContent = 'Navigate';
    document.body.append(link);
    link.click();
    link.remove();
  }, path);
}
async function openThemes(page, layout, width) {
  if (layout === 'inspector') {
    if (width === 390)
      await page
        .getByRole('button', {name: 'Expand inspector', exact: true})
        .click();
    const section = page.locator('[data-section=themes] > button');
    if ((await section.getAttribute('aria-expanded')) !== 'true')
      await section.click();
  } else if (layout === 'dock') {
    await page.locator('button[data-panel=themes]').click();
  } else {
    const button = page.getByRole('button', {name: 'Themes', exact: true});
    if ((await button.getAttribute('aria-expanded')) !== 'true')
      await button.click();
  }
  await page.locator('[data-theme-option]:visible').first().waitFor();
}
try {
  for (const layout of ['inspector', 'dock', 'studio']) {
    for (const width of [1440, 390]) {
      if (process.env.SNIPPET_LAYOUT && layout !== process.env.SNIPPET_LAYOUT)
        continue;
      if (
        process.env.SNIPPET_WIDTH &&
        width !== Number(process.env.SNIPPET_WIDTH)
      )
        continue;
      const tag = `${layout}-${width}`;
      const context = await browser.newContext({
        viewport: {width, height: width === 390 ? 844 : 900},
        permissions: ['clipboard-read', 'clipboard-write'],
      });
      await context.addInitScript(layout => {
        localStorage.setItem(
          '@store/ui',
          JSON.stringify({locale: 'en', themeMode: 'dark'}),
        );
        localStorage.setItem(
          'codeimage:editor-settings',
          JSON.stringify({layout}),
        );
        if (!sessionStorage.getItem('_mockAuth'))
          sessionStorage.setItem(
            '_mockAuth',
            JSON.stringify({authenticated: true}),
          );
        window.umami = {track() {}};
        Object.defineProperty(navigator, 'share', {
          configurable: true,
          value: async data => {
            window.__shared = data;
          },
        });
        Object.defineProperty(navigator, 'canShare', {
          configurable: true,
          value: () => true,
        });
      }, layout);
      const page = await context.newPage();
      page.setDefaultTimeout(20000);
      page.setDefaultNavigationTimeout(60000);
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      const saves = [];
      page.on('request', request => {
        if (
          request.method() === 'PUT' &&
          /\/api\/v1\/project\/[^/]+$/.test(request.url())
        )
          saves.push(request.postDataJSON());
      });
      await page.goto(base);
      await page.getByRole('button', {name: 'New', exact: true}).waitFor();
      await page.evaluate(async () => {
        const {worker} = await import('/src/mocks/browser.ts');
        const {http, HttpResponse, delay} =
          await import('/node_modules/msw/lib/core/index.mjs');
        const {db} = await import('/src/mocks/db.ts');
        worker.use(
          http.get('*/api/v1/project/:id', async ({params}) => {
            await delay(1800);
            return HttpResponse.json(
              db.project.findFirst({where: {id: {equals: params.id}}}),
            );
          }),
        );
      });
      await page.getByRole('button', {name: 'New', exact: true}).click();
      await page.locator('.unified-editor[data-page-state=loading]').waitFor();
      await page.locator('[data-frame-placeholder]').waitFor();
      const loadingHeader = await page
        .locator('.unified-editor > header')
        .boundingBox();
      const loadingLayout = await page
        .locator('.unified-editor > header + *')
        .boundingBox();
      await ready(page);
      check(
        JSON.stringify(loadingHeader) ===
          JSON.stringify(
            await page.locator('.unified-editor > header').boundingBox(),
          ) &&
          JSON.stringify(loadingLayout) ===
            JSON.stringify(
              await page.locator('.unified-editor > header + *').boundingBox(),
            ),
        `${tag}: loading uses the frame placeholder and keeps header and layout geometry`,
      );
      await page.evaluate(async () =>
        (await import('/src/mocks/browser.ts')).worker.resetHandlers(),
      );
      const id = new URL(page.url()).pathname.slice(1);
      check(
        !!id &&
          id !== 'classic' &&
          (await page.locator('.unified-editor').count()) === 1,
        `${tag}: dashboard creation opens a unified snippet`,
      );

      await command(page, 'Padding: 64');
      await command(page, 'Theme: Dracula');
      await page.waitForTimeout(4200);
      check(
        saves.some(
          body =>
            body.frame.padding === 64 &&
            body.editorOptions.themeId === 'dracula',
        ),
        `${tag}: owner changes save to the account`,
      );
      await page.reload();
      await ready(page);
      check(
        await page.evaluate(
          () =>
            window.__frame.store.padding === 64 &&
            window.__editor.state.options.themeId === 'dracula',
        ),
        `${tag}: padding and theme survive reload`,
      );
      await page.waitForTimeout(4200);
      const beforeHover = saves.length;
      await openThemes(page, layout, width);
      const hover = page
        .locator(
          '[data-theme-option]:visible:not([data-theme-option="dracula"])',
        )
        .first();
      const previewName = (await hover.innerText()).trim();
      await hover.hover();
      await page.waitForFunction(
        () => window.__editor.state.options.themeId !== 'dracula',
      );
      await page.waitForTimeout(4200);
      await page.mouse.move(0, 0);
      await page.waitForFunction(
        () => window.__editor.state.options.themeId === 'dracula',
      );
      await page.keyboard.press('Escape');
      await page.waitForTimeout(4200);
      check(
        saves.length === beforeHover,
        `${tag}: theme hover restores the applied theme without saving`,
      );
      await page.keyboard.press('Meta+k');
      const commands = page.locator('[data-command-menu]');
      await commands.getByRole('combobox').fill(`Theme: ${previewName}`);
      await page.waitForFunction(
        () => window.__editor.state.options.themeId !== 'dracula',
      );
      await page.waitForTimeout(4200);
      await page.keyboard.press('Escape');
      await page.waitForFunction(
        () => window.__editor.state.options.themeId === 'dracula',
      );
      check(
        saves.length === beforeHover,
        `${tag}: command previews send no save request`,
      );

      // The same snippet and layout after a fresh load are the ownership comparison.
      await page.reload();
      await ready(page);
      const editableBox = await frame(page).boundingBox();
      await page.getByRole('button', {name: 'Share', exact: true}).click();
      check(
        await page.evaluate(() => window.__shared?.url === location.href),
        `${tag}: header Share includes the snippet URL`,
      );
      await page.evaluate(async id => {
        window.__db.project.update({
          where: {id: {equals: id}},
          data: {ownerId: 'another-user', isOwner: false},
        });
        await window.__persist();
      }, id);
      await page.reload();
      await ready(page, 'read-only');
      check(
        (await page.locator('[data-read-only-banner]').count()) === 1 &&
          (await page
            .getByRole('button', {name: 'Clone', exact: true})
            .isVisible()),
        `${tag}: one read-only banner offers Clone`,
      );
      check(
        (await page
          .locator('[data-control]:visible, [data-theme-option]:visible')
          .count()) === 0,
        `${tag}: editing controls are hidden`,
      );
      const code = page.locator('[data-fit-scale] .cm-content');
      check(
        (await code.getAttribute('contenteditable')) === 'false',
        `${tag}: code cannot be edited`,
      );
      const unchanged = await page.evaluate(() =>
        JSON.stringify({
          frame: window.__frame.stateToPersist(),
          options: window.__editor.state.options,
        }),
      );
      const readonlySaves = saves.length;
      await page
        .locator('.unified-editor > header')
        .click({position: {x: 5, y: 5}});
      for (const key of ['p', 'b', 'h', 'w']) await page.keyboard.press(key);
      await page.waitForTimeout(4200);
      check(
        unchanged ===
          (await page.evaluate(() =>
            JSON.stringify({
              frame: window.__frame.stateToPersist(),
              options: window.__editor.state.options,
            }),
          )) && readonlySaves === saves.length,
        `${tag}: read-only keyboard shortcuts cannot change or save the snippet`,
      );
      const readonlyBox = await frame(page).boundingBox();
      check(
        JSON.stringify(editableBox) === JSON.stringify(readonlyBox),
        `${tag}: read-only ownership leaves the frame box identical`,
      );
      const withBanner = await frame(page).boundingBox();
      await page.locator('[data-read-only-banner]').evaluate(element => {
        element.style.display = 'none';
      });
      check(
        JSON.stringify(withBanner) ===
          JSON.stringify(await frame(page).boundingBox()),
        `${tag}: the banner occupies no canvas space`,
      );
      await page.locator('[data-read-only-banner]').evaluate(element => {
        element.style.display = '';
      });
      await page.screenshot({path: `${out}/${tag}.png`});

      await page.keyboard.press('Meta+k');
      await commands.waitFor();
      check(
        (await commands
          .getByRole('option', {
            name: /^(Theme:|Randomize|Format code|Toggle )/,
          })
          .count()) === 0,
        `${tag}: read-only commands omit snippet mutations`,
      );
      await commands.getByRole('combobox').fill('Padding');
      check(
        (await commands.getByRole('option').count()) === 0,
        `${tag}: padding is absent from read-only commands`,
      );
      await page.keyboard.press('Escape');
      await page.locator('[data-settings-trigger]:visible').first().click();
      await page.locator('[data-settings]').waitFor();
      check(
        await page.locator('[data-settings]').isVisible(),
        `${tag}: settings remain available`,
      );
      await page.keyboard.press('Escape');
      const download = page.waitForEvent('download');
      await page
        .getByRole('button', {name: /^Export$/})
        .first()
        .click();
      check(
        (await download).suggestedFilename().endsWith('.png'),
        `${tag}: read-only Export downloads an image`,
      );
      await command(page, 'Copy to clipboard');
      await page.waitForFunction(
        () => !document.querySelector('[data-export-image]').disabled,
      );
      const clipboardTypes = await page.evaluate(async () =>
        (await navigator.clipboard.read()).flatMap(item => item.types),
      );
      check(
        clipboardTypes.includes('image/png'),
        `${tag}: read-only command Copy writes an image to the clipboard`,
      );
      const cloned = page.waitForURL(url => url.pathname !== `/${id}`);
      await page.getByRole('button', {name: 'Clone', exact: true}).click();
      await cloned;
      await ready(page);
      const cloneId = new URL(page.url()).pathname.slice(1);
      check(
        cloneId !== id &&
          (await page
            .locator('[data-fit-scale] .cm-content')
            .getAttribute('contenteditable')) === 'true',
        `${tag}: Clone opens a new editable id`,
      );
      // Route updates must discard commands and previews from the previous document.
      await page.keyboard.press('Meta+k');
      await commands.waitFor();
      await navigate(page, `/${id}`);
      await ready(page, 'read-only');
      check(
        !(await commands.isVisible()) &&
          (await page.locator('[data-control-overlay]').count()) === 0,
        `${tag}: navigation closes the previous snippet's editing commands and overlays`,
      );
      await navigate(page, `/${cloneId}`);
      await ready(page);
      check(
        new URL(page.url()).pathname === `/${cloneId}`,
        `${tag}: navigating between snippet ids loads the right ownership`,
      );
      await navigate(page, '/missing-snippet-verification');
      await page.waitForURL('**/404');
      await page.getByText('404', {exact: true}).waitFor();
      check(
        (await page.locator('body').innerText()).includes('404'),
        `${tag}: a missing snippet reaches 404`,
      );
      // A rejected load has the same outcome as a missing id.
      await page.evaluate(async () => {
        const {worker} = await import('/src/mocks/browser.ts');
        const {http, HttpResponse} =
          await import('/node_modules/msw/lib/core/index.mjs');
        worker.use(
          http.get('*/api/v1/project/failed-snippet-verification', () =>
            HttpResponse.error(),
          ),
        );
      });
      await navigate(page, '/failed-snippet-verification');
      await page.waitForURL('**/404');
      await page.getByText('404', {exact: true}).waitFor();
      await page.getByText('404', {exact: true}).waitFor();
      check(true, `${tag}: a failed load reaches 404`);
      await page.evaluate(() =>
        sessionStorage.setItem(
          '_mockAuth',
          JSON.stringify({authenticated: false}),
        ),
      );
      await page.goto(base);
      await ready(page, 'local');
      await page.evaluate(() => {
        const view = window.__editor.activeEditorView();
        view.dispatch({
          changes: {
            from: 0,
            to: view.state.doc.length,
            insert: '// local document verification',
          },
        });
      });
      await page.waitForTimeout(700);
      await navigate(page, `/${cloneId}`);
      await ready(page, 'read-only');
      check(
        !(
          await page.locator('[data-fit-scale] .cm-content').innerText()
        ).includes('local document verification'),
        `${tag}: signed-out snippet has its own code`,
      );
      await navigate(page, '/');
      await ready(page, 'local');
      const restoredLocal = (
        await page.locator('[data-fit-scale] .cm-content').innerText()
      ).includes('local document verification');
      check(
        restoredLocal,
        `${tag}: returning to signed-out / restores the local document`,
      );
      await navigate(page, `/${cloneId}`);
      await ready(page, 'read-only');
      check(
        !(
          await page.locator('[data-fit-scale] .cm-content').innerText()
        ).includes('local document verification'),
        `${tag}: returning to the snippet loads its document again`,
      );
      await context.close();
      check(
        errors.length === 0,
        `${tag}: no page errors (${errors.join('; ')})`,
      );
    }
  }
} finally {
  await browser.close();
  writeFileSync(`${out}/checks.json`, JSON.stringify({results}, null, 2));
}
