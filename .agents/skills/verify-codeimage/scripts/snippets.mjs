import assert from 'node:assert/strict';
import {mkdir, readFile, writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {PNG} from 'pngjs';
import {createMockContext} from './mock-context.mjs';

const isSave = request =>
  request.method() === 'PUT' &&
  /\/api\/v1\/project\/[^/]+$/.test(new URL(request.url()).pathname);
const frame = page =>
  page.locator('[data-fit-scale] [data-frame-content]').first();
const code = page => page.locator('[data-fit-scale] .cm-content').first();

async function dismissNews(page) {
  const showcase = page.getByRole('dialog', {name: "What\'s new", exact: true});
  if (await showcase.isVisible()) {
    await showcase.getByRole('button', {name: 'Close', exact: true}).click();
    await showcase.waitFor({state: 'hidden'});
  }
  const dismiss = page.getByRole('button', {
    name: "Dismiss what's new",
    exact: true,
  });
  if (await dismiss.isVisible()) {
    await dismiss.click();
    await page.locator('[data-whats-new=nudge]').waitFor({state: 'hidden'});
  }
}

async function ready(page, kind = 'owner') {
  await page.locator(`.unified-editor[data-page-state="${kind}"]`).waitFor();
  await code(page).waitFor();
  await page
    .locator('[data-fit-scale] [data-frame-placeholder]')
    .waitFor({state: 'detached'});
  await page.locator('[data-fit-scale] .cm-content .cm-line').first().waitFor();
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(800);
  await dismissNews(page);
  const close = page.getByRole('button', {name: /^close$/i}).first();
  if (await close.isVisible()) await close.click();
  await page.locator('[data-whats-new="showcase"]').waitFor({state: 'hidden'});
}

async function command(page, label) {
  await page.keyboard.press('ControlOrMeta+k');
  const menu = page.locator('[data-command-menu]');
  await menu.waitFor();
  await menu.getByRole('combobox').fill(label);
  await menu.getByRole('option', {name: label, exact: true}).click();
  await menu.waitFor({state: 'detached'});
}

async function navigate(page, path) {
  // A link fixture exercises the router's id update without recreating the page.
  await page.evaluate(path => {
    const link = document.createElement('a');
    link.href = path;
    link.textContent = 'Navigate';
    document.body.append(link);
    link.click();
    link.remove();
  }, path);
}

async function createProject(page, base, options = {}) {
  if (
    await page
      .getByRole('button', {name: /^Sign in(?: with GitHub)?$/})
      .isVisible()
  )
    await page
      .getByRole('button', {name: /^Sign in(?: with GitHub)?$/})
      .click();
  else await page.goto(`${base}/dashboard`);
  await page.getByRole('button', {name: 'New', exact: true}).first().waitFor();
  if (options.delayed) {
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
  }
  const created = page.waitForResponse(
    response =>
      response.request().method() === 'POST' &&
      new URL(response.url()).pathname === '/api/v1/project',
  );
  await page.getByRole('button', {name: 'New', exact: true}).first().click();
  const project = await (await created).json();
  if (options.delayed) return project;
  await ready(page);
  return project;
}

async function makeReadOnly(page, id) {
  // Ownership is an MSW fixture, not a mutation of the editor's stores.
  await page.evaluate(async id => {
    const {db} = await import('/src/mocks/db.ts');
    const project = db.project.findFirst({where: {id: {equals: id}}});
    db.project.update({
      where: {id: {equals: id}},
      data: {
        ownerId: 'another-user',
        isOwner: false,
        frame: {...project.frame, padding: 32},
        editorOptions: {...project.editorOptions, themeId: 'dracula'},
      },
    });
    await (await import('/src/mocks/persist.ts')).persistDb();
  }, id);
  await page.reload();
  await ready(page, 'read-only');
}

async function projectData(page, id) {
  return page.evaluate(
    async id => (await fetch(`/api/v1/project/${id}`)).json(),
    id,
  );
}

async function savedChange(page, change, matches) {
  const saved = page.waitForRequest(
    request => isSave(request) && matches(request.postDataJSON()),
    {timeout: 60000},
  );
  await change();
  assert.equal(
    (await (await saved).response())?.status(),
    200,
    'account save succeeds',
  );
}

async function openThemes(page, layout, width) {
  await dismissNews(page);
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
    const themes = page.getByRole('button', {name: 'Themes', exact: true});
    if ((await themes.getAttribute('aria-expanded')) !== 'true')
      await themes.click();
  }
  await page.locator('[data-theme-option]:visible').first().waitFor();
}

async function renderedTheme(page) {
  return page.locator('[data-fit-scale]').evaluate(element =>
    JSON.stringify(
      [...element.querySelectorAll('.cm-content, .cm-line span')].map(node => {
        const style = getComputedStyle(node);
        return [style.color, style.backgroundColor];
      }),
    ),
  );
}

async function waitTheme(page, applied, changed) {
  for (let attempt = 0; attempt < 100; attempt++) {
    if (((await renderedTheme(page)) !== applied) === changed) return;
    await page.waitForTimeout(100);
  }
  assert.fail(
    changed
      ? 'theme preview changes rendered colours'
      : 'leaving preview restores rendered colours',
  );
}

async function clipboardImage(page) {
  for (let attempt = 0; attempt < 100; attempt++) {
    const bytes = await page.evaluate(async () => {
      const item = (await navigator.clipboard.read()).find(item =>
        item.types.includes('image/png'),
      );
      return item
        ? [
            ...new Uint8Array(
              await (await item.getType('image/png')).arrayBuffer(),
            ),
          ]
        : null;
    });
    if (bytes) return PNG.sync.read(Buffer.from(bytes));
    await page.waitForTimeout(100);
  }
  assert.fail('Copy writes an actual PNG to the clipboard');
}

export async function auditSnippets({feature, doctor, context, base, out}) {
  const screenshots = resolve(out, 'read-only');
  await mkdir(screenshots, {recursive: true});
  async function matrix(name, run, {share = false} = {}) {
    const layouts = process.env.VERIFY_SNIPPET_LAYOUT
      ? [process.env.VERIFY_SNIPPET_LAYOUT]
      : ['inspector', 'dock', 'studio'];
    const widths = process.env.VERIFY_SNIPPET_WIDTH
      ? [Number(process.env.VERIFY_SNIPPET_WIDTH)]
      : [1440, 390];
    assert.ok(
      layouts.every(value => ['inspector', 'dock', 'studio'].includes(value)),
      'known snippet layout',
    );
    assert.ok(
      widths.every(value => [1440, 390].includes(value)),
      'known snippet viewport',
    );
    const lanes = [];
    try {
      for (const layout of layouts) {
        for (const width of widths) {
          const tag = `${layout}-${width}`;
          const laneContext = await createMockContext(context.browser(), base, {
            viewport: {width, height: width === 390 ? 844 : 900},
            locale: 'en-US',
            permissions: ['clipboard-read', 'clipboard-write'],
          });
          const lane = await laneContext.newPage();
          await laneContext.tracing.start({screenshots: true, snapshots: true});
          const errors = [];
          lane.on('pageerror', error => errors.push(String(error)));
          lane.setDefaultTimeout(20000);
          lane.setDefaultNavigationTimeout(60000);
          try {
            if (share)
              await laneContext.addInitScript(() => {
                // Headless Chromium has no OS share sheet; verify its input boundary.
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
              });
            await doctor('/', 'editor', layout, lane);
            await run({page: lane, layout, width, tag});
            assert.deepEqual(errors, [], `${tag}: no uncaught page errors`);
            lanes.push({layout, width, status: 'passed'});
            console.log(`PASS ${name}/${tag}`);
          } catch (error) {
            await lane
              .screenshot({path: resolve(out, `${name}-${tag}-failure.png`)})
              .catch(() => {});
            await writeFile(
              resolve(out, `${name}-${tag}-failure.aria.txt`),
              await lane
                .locator('body')
                .ariaSnapshot()
                .catch(() => ''),
            );
            lanes.push({
              layout,
              width,
              status: 'failed',
              error: String(error),
              errors,
            });
            throw error;
          } finally {
            await laneContext.tracing
              .stop({
                path: resolve(out, `${name}-${tag}.zip`),
              })
              .catch(() => {});
            await laneContext.close();
          }
        }
      }
    } finally {
      await writeFile(
        resolve(out, `${name}-matrix.json`),
        JSON.stringify(lanes, null, 2),
      );
    }
  }

  await feature('snippet-save', () =>
    matrix('snippet-save', async ({page}) => {
      const project = await createProject(page, base, {delayed: true});
      await page.locator('.unified-editor[data-page-state=loading]').waitFor();
      await page.locator('[data-frame-placeholder]').waitFor();
      assert.equal(
        await page.locator('[data-export-image]').isDisabled(),
        true,
      );
      const header = await page
        .locator('.unified-editor > header')
        .boundingBox();
      const layout = await page
        .locator('.unified-editor > header + *')
        .boundingBox();
      await ready(page);
      assert.equal(new URL(page.url()).pathname, `/${project.id}`);
      assert.equal(await page.locator('.unified-editor').count(), 1);
      assert.deepEqual(
        await page.locator('.unified-editor > header').boundingBox(),
        header,
      );
      assert.deepEqual(
        await page.locator('.unified-editor > header + *').boundingBox(),
        layout,
      );
      await page.evaluate(async () =>
        (await import('/src/mocks/browser.ts')).worker.resetHandlers(),
      );
      await savedChange(
        page,
        async () => {
          await command(page, 'Padding: 32');
          await command(page, 'Theme: Dracula');
        },
        body =>
          body.frame.padding === 32 && body.editorOptions.themeId === 'dracula',
      );
      await page.reload();
      await ready(page);
      const data = await projectData(page, project.id);
      assert.equal(data.frame.padding, 32);
      assert.equal(data.editorOptions.themeId, 'dracula');
      assert.equal(
        await frame(page)
          .locator('..')
          .evaluate(node => getComputedStyle(node).paddingTop),
        '32px',
        'the reloaded canvas renders the saved padding',
      );
      await openThemes(
        page,
        await page.locator('[data-layout]').getAttribute('data-layout'),
        page.viewportSize().width,
      );
      assert.equal(
        await page
          .locator('[data-theme-option=dracula]:visible')
          .getAttribute('aria-selected'),
        'true',
      );
    }),
  );

  await feature('snippet-previews', () =>
    matrix('snippet-previews', async ({page, layout, width}) => {
      const project = await createProject(page, base);
      await savedChange(
        page,
        () => command(page, 'Theme: Dracula'),
        body => body.editorOptions.themeId === 'dracula',
      );
      const applied = await renderedTheme(page);
      const saves = [];
      const observe = request => {
        if (isSave(request)) saves.push(request.postDataJSON());
      };
      page.on('request', observe);
      const persisted = await projectData(page, project.id);
      await openThemes(page, layout, width);
      const hover = page
        .locator('[data-theme-option]:visible:not([data-theme-option=dracula])')
        .first();
      const previewName = (await hover.innerText()).trim();
      await hover.hover();
      await waitTheme(page, applied, true);
      await page.waitForTimeout(4200);
      await page.mouse.move(0, 0);
      await waitTheme(page, applied, false);
      await page.keyboard.press('Escape');
      await page.waitForTimeout(4200);
      assert.deepEqual(saves, [], 'hover previews send no save');
      await page.keyboard.press('ControlOrMeta+k');
      await page
        .locator('[data-command-menu]')
        .getByRole('combobox')
        .fill(`Theme: ${previewName}`);
      await waitTheme(page, applied, true);
      await page.waitForTimeout(4200);
      await page.keyboard.press('Escape');
      await page.locator('[data-command-menu]').waitFor({state: 'detached'});
      await waitTheme(page, applied, false);
      await page.waitForTimeout(4200);
      assert.deepEqual(saves, [], 'command previews send no save');
      assert.deepEqual(await projectData(page, project.id), persisted);
      page.off('request', observe);
    }),
  );

  await feature('snippet-read-only', () =>
    matrix(
      'snippet-read-only',
      async ({page, layout, width, tag}) => {
        const project = await createProject(page, base);
        await page.getByRole('button', {name: 'Share', exact: true}).click();
        assert.equal(
          await page.evaluate(() => window.__shared?.url),
          page.url(),
        );
        await makeReadOnly(page, project.id);
        assert.equal(await page.locator('[data-read-only-banner]').count(), 1);
        assert.equal(
          await page
            .getByRole('button', {name: 'Clone', exact: true})
            .isVisible(),
          true,
        );
        assert.equal(
          await page
            .locator('[data-control]:visible, [data-theme-option]:visible')
            .count(),
          0,
        );
        assert.equal(await code(page).getAttribute('contenteditable'), 'false');
        const persisted = await projectData(page, project.id);
        const saves = [];
        page.on('request', request => {
          if (isSave(request)) saves.push(request.postDataJSON());
        });
        await page
          .locator('.unified-editor > header')
          .click({position: {x: 5, y: 5}});
        const rendered = await page.locator('[data-fit-scale]').innerHTML();
        for (const key of ['p', 'b', 'h', 'w']) await page.keyboard.press(key);
        await page.waitForTimeout(4200);
        assert.deepEqual(saves, []);
        assert.deepEqual(await projectData(page, project.id), persisted);
        assert.equal(
          await page.locator('[data-fit-scale]').innerHTML(),
          rendered,
          'read-only shortcuts leave the rendered snippet unchanged',
        );
        assert.equal(
          await page
            .locator('[data-editing-controls], [data-control-panel]')
            .count(),
          0,
        );
        await dismissNews(page);
        if (layout === 'inspector')
          assert.equal(
            await page
              .getByRole('complementary', {
                name: 'Image inspector',
                exact: true,
              })
              .count(),
            0,
          );
        if (layout === 'studio') {
          assert.equal(await page.locator('#studio-panel').count(), 0);
          if (width === 390)
            assert.equal(
              await page
                .getByRole('navigation', {name: 'Editor panels'})
                .count(),
              0,
            );
        }
        if (layout === 'dock' && width === 1440) {
          const pill = await page
            .getByRole('toolbar', {name: 'Editor controls'})
            .boundingBox();
          assert.equal(
            await page.locator('[data-control-dock] > div').count(),
            1,
          );
          assert.ok(
            pill.width < 400 &&
              Math.abs(pill.x + pill.width / 2 - width / 2) < 1,
          );
          assert.equal(
            await page
              .locator('[data-control-dock] [data-shortcut-help]')
              .count(),
            1,
          );
        }
        if (layout === 'inspector' || layout === 'studio') {
          const canvas = await page.locator('main').boundingBox();
          const rail =
            layout === 'studio' && width === 1440
              ? await page
                  .getByRole('navigation', {name: 'Editor panels'})
                  .boundingBox()
              : null;
          assert.equal(canvas.x, rail ? rail.x + rail.width + 8 : 8);
          assert.equal(canvas.x + canvas.width, width - 8);
        }
        const box = await frame(page).boundingBox();
        const canvas = await page
          .locator('[data-fit-scale]')
          .locator('..')
          .boundingBox();
        assert.ok(
          Math.abs(box.x + box.width / 2 - (canvas.x + canvas.width / 2)) < 1,
        );
        assert.ok(
          Math.abs(box.y + box.height / 2 - (canvas.y + canvas.height / 2)) < 1,
        );
        await page.locator('[data-read-only-banner]').evaluate(node => {
          node.style.display = 'none';
        });
        assert.deepEqual(
          await frame(page).boundingBox(),
          box,
          'banner occupies no canvas space',
        );
        await page.locator('[data-read-only-banner]').evaluate(node => {
          node.style.display = '';
        });
        await page.screenshot({path: resolve(screenshots, `${tag}.png`)});
        if (layout === 'dock' && width === 1440) {
          await page
            .locator('[data-control-dock] [data-shortcut-help] button')
            .click();
          await page.getByRole('dialog').waitFor();
          assert.equal(await page.getByRole('dialog').count(), 1);
          await page.keyboard.press('Escape');
          await page.getByRole('dialog').waitFor({state: 'hidden'});
        }
        await page.keyboard.press('ControlOrMeta+k');
        const menu = page.locator('[data-command-menu]');
        await menu.waitFor();
        assert.equal(
          await menu
            .getByRole('option', {
              name: /^(Theme:|Randomize|Format code|Toggle )/,
            })
            .count(),
          0,
        );
        await menu.getByRole('combobox').fill('Padding');
        assert.equal(await menu.getByRole('option').count(), 0);
        await page.keyboard.press('Escape');
        await menu.waitFor({state: 'detached'});
        await page.locator('[data-settings-trigger]:visible').first().click();
        await page.locator('[data-settings]').waitFor();
        await page.keyboard.press('Escape');
        const downloaded = page.waitForEvent('download');
        await page
          .getByRole('button', {name: /^Export$/})
          .first()
          .click();
        const image = await downloaded;
        assert.match(image.suggestedFilename(), /\.png$/);
        const file = resolve(out, `read-only-${tag}-export.png`);
        await image.saveAs(file);
        PNG.sync.read(await readFile(file));
        await page.evaluate(() =>
          navigator.clipboard.writeText('snippet verification sentinel'),
        );
        await command(page, 'Copy to clipboard');
        await clipboardImage(page);
      },
      {share: true},
    ),
  );

  await feature('snippet-clone', () =>
    matrix('snippet-clone', async ({page}) => {
      const project = await createProject(page, base);
      await makeReadOnly(page, project.id);
      const original = await code(page).innerText();
      await page.getByRole('button', {name: 'Clone', exact: true}).click();
      await page.waitForURL(url => url.pathname !== `/${project.id}`);
      await ready(page);
      assert.notEqual(new URL(page.url()).pathname, `/${project.id}`);
      assert.equal(await code(page).getAttribute('contenteditable'), 'true');
      assert.equal(await code(page).innerText(), original);
    }),
  );

  await feature('snippet-missing', () =>
    matrix('snippet-missing', async ({page}) => {
      await navigate(page, '/missing-snippet-verification');
      await page.waitForURL('**/404');
      await page.getByText('404', {exact: true}).waitFor();
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
    }),
  );

  await feature('snippet-navigation', () =>
    matrix('snippet-navigation', async ({page, layout}) => {
      const first = await createProject(page, base);
      await makeReadOnly(page, first.id);
      const second = await createProject(page, base);
      await savedChange(
        page,
        () => code(page).fill('// second snippet navigation'),
        body => body.editors[0].code === '// second snippet navigation',
      );
      await page.keyboard.press('ControlOrMeta+k');
      await page.locator('[data-command-menu]').waitFor();
      await navigate(page, `/${first.id}`);
      await ready(page, 'read-only');
      assert.equal(
        await page
          .locator('[data-command-menu], [data-control-overlay]')
          .count(),
        0,
      );
      assert.doesNotMatch(
        await code(page).innerText(),
        /second snippet navigation/,
      );
      await navigate(page, `/${second.id}`);
      await ready(page);
      assert.equal(
        await code(page).innerText(),
        '// second snippet navigation',
      );
      if (layout === 'dock') {
        await openThemes(page, layout, page.viewportSize().width);
        await navigate(page, `/${first.id}`);
        await ready(page, 'read-only');
        assert.equal(
          await page.locator('[data-theme-option]:visible').count(),
          0,
        );
        await navigate(page, `/${second.id}`);
        await ready(page);
      }
      await page
        .locator('.unified-editor > header')
        .getByRole('button', {name: 'G', exact: true})
        .click();
      await page.getByRole('menuitem', {name: /^Log ?out$/i}).click();
      await page
        .getByRole('button', {name: /^Sign in(?: with GitHub)?$/})
        .waitFor();
      await ready(page, 'read-only');
      await navigate(page, '/');
      await ready(page, 'local');
      await code(page).fill('// local document verification');
      await page.waitForTimeout(700);
      await navigate(page, `/${first.id}`);
      await ready(page, 'read-only');
      assert.doesNotMatch(
        await code(page).innerText(),
        /local document verification/,
      );
      await navigate(page, '/');
      await ready(page, 'local');
      assert.equal(
        await code(page).innerText(),
        '// local document verification',
      );
      await navigate(page, `/${first.id}`);
      await ready(page, 'read-only');
      assert.doesNotMatch(
        await code(page).innerText(),
        /local document verification/,
      );
    }),
  );
}
