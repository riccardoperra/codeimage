#!/usr/bin/env node
import assert from 'node:assert/strict';
import {createMockContext} from './mock-context.mjs';
import {auditSnippets} from './snippets.mjs';
import {writeFile, readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {PNG} from 'pngjs';
import {createRequire} from 'node:module';
const require = createRequire(
  new URL('../../../../apps/codeimage/package.json', import.meta.url),
);
const {unzipSync} = require('fflate');
export async function audit({page, context, base, out, server}) {
  page.setDefaultTimeout(12000);
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  const results = [];
  const requested = new Set(
    (process.env.VERIFY_CASES ?? '')
      .split(',')
      .map(name => name.trim())
      .filter(Boolean),
  );
  const editor = () =>
    page.locator('.cm-content[contenteditable="true"]').first();
  const shot = name =>
    page.screenshot({path: resolve(out, `${name}.png`), fullPage: true});
  // `layout` saves that layout as the preference first. Without it the
  // stored preference stands, which the persistence case relies on.
  async function doctor(
    route = '/',
    expected = 'editor',
    layout,
    target = page,
  ) {
    assert.equal(server.exitCode, null);
    assert.ok((await fetch(base)).ok);
    await target.goto(base + route);
    const changed =
      layout !== undefined &&
      (await target.evaluate(layout => {
        const key = 'codeimage:editor-settings';
        const stored = JSON.parse(localStorage.getItem(key) ?? '{}');
        if ((stored.layout ?? 'inspector') === layout) return false;
        localStorage.setItem(key, JSON.stringify({...stored, layout}));
        return true;
      }, layout));
    if (changed) await target.reload();
    if (expected === 'dashboard') {
      await target
        .getByRole('button', {name: 'New', exact: true})
        .first()
        .waitFor();
      return;
    }
    await target
      .locator('.cm-content[contenteditable="true"]')
      .first()
      .waitFor({timeout: 60000});
    const close = target.getByRole('button', {name: 'close', exact: true});
    if (await close.isVisible()) await close.click();
    await target.evaluate(() => document.fonts.ready);
    assert.ok(
      await target
        .locator('.cm-content[contenteditable="true"]')
        .first()
        .isVisible(),
    );
  }
  async function feature(name, run) {
    if (requested.size && !requested.has(name)) return;
    console.log(`RUN ${name}`);
    try {
      await doctor('/', 'editor', 'inspector');
      const measurements = await run();
      await shot(name);
      results.push({
        feature: name,
        status: 'passed',
        ...(measurements ? {measurements} : {}),
      });
      console.log(`PASS ${name}`);
    } catch (error) {
      await shot(`${name}-failure`).catch(() => {});
      await writeFile(
        resolve(out, `${name}-failure.aria.txt`),
        await page
          .locator('body')
          .ariaSnapshot()
          .catch(() => ''),
      );
      results.push({feature: name, status: 'failed', error: String(error)});
      console.log(`FAIL ${name}: ${String(error).slice(0, 400)}`);
      await doctor(
        '/',
        name === 'projects' ? 'dashboard' : 'editor',
        'inspector',
      );
    }
    await writeFile(
      resolve(out, 'audit.json'),
      JSON.stringify(results, null, 2),
    );
  }
  async function settings(section) {
    await page.locator('[data-settings-trigger]').click();
    await page.locator(`[data-settings-section="${section}"]`).click();
  }
  async function closeSettings() {
    await page.getByRole('button', {name: 'Close', exact: true}).click();
    await page
      .locator('[data-settings-section=general]')
      .waitFor({state: 'hidden'});
  }
  async function download(name) {
    const [pending] = await Promise.all([
      page.waitForEvent('download', {timeout: 60000}),
      page.locator('[data-export-image]').click(),
    ]);
    const file = resolve(out, name);
    await pending.saveAs(file);
    return readFile(file);
  }
  async function section(id) {
    const button = page.locator(`[data-section="${id}"] > button`);
    if ((await button.getAttribute('aria-expanded')) !== 'true')
      await button.click();
  }
  async function windowStyle(name) {
    await section('window');
    await page
      .locator('[data-control="window.style"]')
      .getByRole('button')
      .click();
    const dialog = page.getByRole('dialog', {name: 'Window', exact: true});
    const close = dialog.getByRole('button', {name: 'Close', exact: true});
    await close.hover();
    const radio = page.getByRole('radio', {name, exact: true});
    await radio.press('Space');
    assert.ok(await radio.isChecked(), `Window style ${name} selected`);
    await close.click();
  }
  async function storedPresets() {
    return page.evaluate(
      () =>
        new Promise((resolve, reject) => {
          const request = indexedDB.open('keyval-store');
          request.onerror = () => reject(request.error);
          request.onsuccess = () => {
            const database = request.result;
            const read = database
              .transaction('keyval')
              .objectStore('keyval')
              .get('presets');
            read.onsuccess = () => {
              database.close();
              resolve(read.result);
            };
            read.onerror = () => {
              database.close();
              reject(read.error);
            };
          };
        }),
    );
  }
  async function fresh({name, layout, viewport, initialize}, run) {
    const previous = {page, context};
    context = await createMockContext(context.browser(), base, {
      viewport,
      locale: 'en-US',
      colorScheme: 'dark',
      permissions: ['clipboard-read', 'clipboard-write'],
    });
    try {
      await context.addInitScript(layout => {
        localStorage.setItem(
          'codeimage:editor-settings',
          JSON.stringify({layout}),
        );
        localStorage.setItem(
          '@store/ui',
          JSON.stringify({themeMode: 'dark', locale: 'en'}),
        );
      }, layout);
      await context.tracing.start({
        screenshots: true,
        snapshots: true,
        sources: true,
      });
      page = await context.newPage();
      if (initialize) await initialize(context, page);
      page.setDefaultTimeout(60000);
      const errors = [];
      page.on('pageerror', error => errors.push(String(error)));
      try {
        const result = await run({
          page,
          context,
          doctor,
          editor,
          section,
          settings,
          closeSettings,
          download,
        });
        assert.deepEqual(errors, [], `${name}: no uncaught browser errors`);
        return result;
      } catch (error) {
        await shot(`${name}-failure`).catch(() => {});
        await writeFile(
          resolve(out, `${name}-failure.aria.txt`),
          await page
            .locator('body')
            .ariaSnapshot()
            .catch(() => ''),
        );
        throw error;
      }
    } finally {
      await context.tracing
        .stop({path: resolve(out, `${name}-trace.zip`)})
        .catch(() => {});
      await context.close();
      ({page, context} = previous);
    }
  }
  await feature('frame-cold-start', async () => {
    const {verifyColdStart} = await import('./frame-regressions.mjs');
    return verifyColdStart({fresh, out});
  });
  await feature('export-screen-parity', async () => {
    const {verifyExportScreen} = await import('./frame-regressions.mjs');
    return verifyExportScreen({fresh, out});
  });
  await feature('retired-classic-route', () =>
    fresh(
      {
        name: 'retired-classic-route',
        layout: 'inspector',
        viewport: {width: 1440, height: 900},
      },
      async ({page}) => {
        await page.goto(`${base}/classic`, {waitUntil: 'domcontentloaded'});
        await page.waitForURL('**/404');
        await page.getByText('404', {exact: true}).waitFor();
        assert.equal(await page.locator('.unified-editor').count(), 0);
        await page.screenshot({
          path: resolve(out, 'retired-classic-route-404.png'),
        });
        return {url: page.url(), editorMounted: false};
      },
    ),
  );
  await feature('editor', async () => {
    await doctor();
    await editor().fill('const audit = 1;');
    await editor().press('End');
    await page.keyboard.type('x');
    await page.keyboard.press('ControlOrMeta+z');
    assert.equal(await editor().innerText(), 'const audit = 1;');
  });
  await feature('appearance', async () => {
    await section('themes');
    await page
      .getByRole('textbox', {name: 'Search themes', exact: true})
      .fill('Dracula');
    const option = page.getByRole('option', {
      name: 'Dracula Dark theme',
      exact: true,
    });
    await option.click();
    assert.equal(await option.getAttribute('aria-selected'), 'true');
    await editor().fill('const dracula = true;');
    PNG.sync.read(await download('dracula.png'));
    await section('window');
    const wash = page
      .locator('[data-control="window.surface"]')
      .getByRole('radio', {name: 'Accent wash', exact: true});
    await wash.focus();
    await page.keyboard.press('Space');
    assert.ok(await wash.isChecked(), 'Accent wash surface tile checked');
    const surface = page
      .locator('.cm-editor')
      .first()
      .locator('xpath=ancestor::*[@data-surface][1]');
    assert.equal(await surface.getAttribute('data-surface'), 'wash');
    await surface.screenshot({path: resolve(out, 'appearance-wash.png')});
    PNG.sync.read(await download('wash.png'));
  });
  await feature('watermark', async () => {
    const {verifyWatermark} = await import('./watermark.mjs');
    await verifyWatermark({page, out, download, section, windowStyle});
  });
  await feature('tabs', async () => {
    await windowStyle('Editor');
    const strip = page
      .locator('[data-window-tabs]')
      .filter({has: page.getByRole('button', {name: 'Add tab', exact: true})})
      .first();
    const name = () =>
      strip.locator('[data-active="true"] [aria-label="Tab name"] input');
    await editor().fill('const first = 1;');
    await name().fill('first.ts');
    await page.keyboard.press('Escape');
    await strip.getByRole('button', {name: 'Add tab', exact: true}).click();
    await editor().fill('print("second")');
    await name().fill('hello.py');
    await page.keyboard.press('Escape');
    await strip
      .locator('[data-window-tab]')
      .filter({hasText: 'first.ts'})
      .click();
    assert.equal(await editor().innerText(), 'const first = 1;');
    await strip
      .locator('[data-window-tab]')
      .filter({hasText: 'hello.py'})
      .click();
    assert.equal(await editor().innerText(), 'print("second")');
    await shot('tabs-two');
    await page.locator('[data-export-menu]').click();
    const [zip] = await Promise.all([
      page.waitForEvent('download', {timeout: 60000}),
      page.locator('[data-export-action="tabs"]').click(),
    ]);
    await zip.saveAs(resolve(out, 'tabs.zip'));
    const entries = Object.entries(
      unzipSync(await readFile(resolve(out, 'tabs.zip'))),
    );
    assert.deepEqual(entries.map(([name]) => name).sort(), [
      '01-first.ts.png',
      '02-hello.py.png',
    ]);
    for (const [, data] of entries) PNG.sync.read(Buffer.from(data));
    await strip
      .locator('[data-active="true"]')
      .getByRole('button', {name: 'Close tab', exact: true})
      .click();
    assert.equal(await strip.locator('[data-window-tab]').count(), 1);
  });
  await feature('settings', async () => {
    await settings('appearance');
    await page
      .locator('[data-setting=panel-side]')
      .getByRole('tab', {name: 'Left', exact: true})
      .click();
    await closeSettings();
    assert.ok(
      (
        await page
          .getByRole('complementary', {name: 'Image inspector', exact: true})
          .boundingBox()
      ).x < 500,
    );
    await settings('appearance');
    await page
      .locator('[data-setting=panel-side]')
      .getByRole('tab', {name: 'Right', exact: true})
      .click();
    await page
      .getByRole('textbox', {name: 'Search settings', exact: true})
      .fill('quality');
    await closeSettings();
    await settings('general');
    assert.equal(
      await page
        .getByRole('textbox', {name: 'Search settings', exact: true})
        .inputValue(),
      '',
    );
    await closeSettings();
    await settings('general');
    await page
      .locator('[data-setting=language]')
      .getByRole('tab', {name: 'Italian', exact: true})
      .click();
    assert.equal(
      await page.locator('[data-setting=language] [id$="-title"]').innerText(),
      'Lingua',
    );
    await page
      .locator('[data-setting=language]')
      .getByRole('tab', {name: 'Inglese', exact: true})
      .click();
    await closeSettings();
    await page.keyboard.press('ControlOrMeta+k');
    const search = page.getByRole('combobox', {
      name: 'Search themes and options',
      exact: true,
    });
    await search.fill('Dracula');
    await search.press('Enter');
    await search.waitFor({state: 'hidden'});
  });
  await feature('line-marks', async () => {
    await editor().fill('const marked = 1;\nconst other = 2;');
    await editor().press('ControlOrMeta+Home');
    await editor().press('ControlOrMeta+Alt+1');
    await editor().locator('[data-mark="highlight"]').waitFor();
    PNG.sync.read(await download('line-marks.png'));
    await editor().press('ControlOrMeta+Alt+0');
    assert.equal(await editor().locator('[data-mark="highlight"]').count(), 0);
    const diff =
      'diff --git a/demo.ts b/demo.ts\n--- a/demo.ts\n+++ b/demo.ts\n@@ -1 +1 @@\n-const before = 1;\n+const after = 2;\n';
    await page.evaluate(text => navigator.clipboard.writeText(text), diff);
    await editor().click();
    await editor().press('ControlOrMeta+a');
    await editor().press('ControlOrMeta+v');
    await page
      .getByRole('button', {name: 'Import as diff', exact: true})
      .click();
    await editor().locator('[data-mark="added"]').first().waitFor();
    assert.match(await editor().innerText(), /const after = 2/);
    await shot('diff-import');
    await page.getByRole('button', {name: 'Undo', exact: true}).last().click();
  });
  await feature('signatures', async () => {
    await section('frame');
    await page.locator('#signature-options').click();
    await writeFile(
      resolve(out, 'signature-open.aria.txt'),
      await page.locator('body').ariaSnapshot(),
    );
    await page
      .getByPlaceholder('@handle or profile link', {exact: true})
      .fill('@verification');
    await page
      .getByRole('button', {name: 'Saved signatures', exact: true})
      .click();
    await page
      .getByRole('menuitem', {name: 'Save as new', exact: true})
      .click();
    await page
      .getByRole('group', {name: 'Signature name', exact: true})
      .getByRole('textbox')
      .fill('Verification signature');
    await page.getByRole('button', {name: 'Save', exact: true}).click();
    await page.keyboard.press('Escape');
    assert.match(
      await page.locator('[data-frame-signature]').first().innerText(),
      /@verification/,
    );
    PNG.sync.read(await download('signature.png'));
    await page.reload();
    await editor().waitFor();
    await section('frame');
    await page.locator('#signature-options').click();
    await page
      .getByRole('button', {name: 'Saved signatures', exact: true})
      .click();
    await page.getByRole('menuitem', {name: /Verification signature/}).click();
    assert.equal(
      await page
        .getByPlaceholder('@handle or profile link', {exact: true})
        .inputValue(),
      '@verification',
    );
  });
  await feature('whats-new', async () => {
    await settings('whats-new');
    assert.ok((await page.locator('[data-setting^="news-"]').count()) > 0);
    await writeFile(
      resolve(out, 'whats-new.aria.txt'),
      await page.locator('body').ariaSnapshot(),
    );
    await page
      .locator('[data-setting=news-command-menu]')
      .getByRole('button', {name: 'Show me', exact: true})
      .click();
    await page.locator('[data-command-menu]').waitFor();
    await page
      .locator('[data-settings-section=general]')
      .waitFor({state: 'hidden'});
  });
  await feature('exports', async () => {
    const fallbacks = [];
    const observe = message => {
      if (message.text().includes('Takumi export failed'))
        fallbacks.push(message.text());
    };
    page.on('console', observe);
    await editor().fill('const formats = true;');
    await settings('export');
    await page
      .locator('[data-setting=export-format]')
      .getByRole('tab', {name: 'SVG', exact: true})
      .click();
    await closeSettings();
    assert.match((await download('snippet.svg')).toString(), /<svg/);
    await settings('export');
    await page
      .locator('[data-setting=export-format]')
      .getByRole('tab', {name: 'PNG', exact: true})
      .click();
    await closeSettings();
    await settings('experiments');
    await page.locator('#settings-rendering-engine').focus();
    await page.keyboard.press('Space');
    assert.equal(
      await page
        .locator('#settings-rendering-engine')
        .getAttribute('aria-checked'),
      'true',
    );
    await closeSettings();
    PNG.sync.read(await download('takumi.png'));
    page.off('console', observe);
    assert.deepEqual(fallbacks, [], 'Takumi should not fall back');
    await settings('experiments');
    await page.locator('#settings-rendering-engine').focus();
    await page.keyboard.press('Space');
    await closeSettings();
  });
  await feature('secrets', async () => {
    await editor().fill('const api_key = "active-r4nd0m-K7v9Qp2X";');
    await page.locator('[data-export-image]').click();
    const warning = page.getByRole('alertdialog');
    await warning.waitFor();
    await shot('secrets-review');
    await writeFile(
      resolve(out, 'secrets.aria.txt'),
      await warning.ariaSnapshot(),
    );
    let downloads = 0;
    const count = () => downloads++;
    page.on('download', count);
    await warning.getByRole('button', {name: 'Close', exact: true}).click();
    await warning.waitFor({state: 'hidden'});
    assert.equal(downloads, 0);
    await page.locator('[data-export-image]').click();
    await warning.waitFor();
    await warning
      .getByRole('button', {name: 'Redact all', exact: true})
      .click();
    assert.match(await editor().innerText(), /•/);
    assert.doesNotMatch(await editor().innerText(), /K7v9Qp2X/);
    assert.equal(downloads, 0);
    const [redacted] = await Promise.all([
      page.waitForEvent('download', {timeout: 60000}),
      warning.getByRole('button', {name: 'Confirm', exact: true}).click(),
    ]);
    await redacted.saveAs(resolve(out, 'redacted.png'));
    PNG.sync.read(await readFile(resolve(out, 'redacted.png')));
    assert.equal(downloads, 1);
    page.off('download', count);
  });
  await feature('presets', async () => {
    await doctor('/', 'editor', 'studio');
    await page.getByRole('button', {name: 'Presets', exact: true}).click();
    await page
      .getByRole('button', {name: 'Add preset', exact: true})
      .first()
      .click();
    const dialog = page.getByRole('alertdialog', {
      name: 'Add a new preset',
      exact: true,
    });
    await dialog.getByRole('textbox').fill('Verification preset');
    await dialog.getByRole('button', {name: 'Confirm', exact: true}).click();
    await page.locator('li').filter({hasText: 'Verification preset'}).waitFor();
    await page.reload();
    await editor().waitFor();
    await page.getByRole('button', {name: 'Presets', exact: true}).click();
    await page.locator('li').filter({hasText: 'Verification preset'}).click();
    await shot('preset-reopened');
  });
  await feature('export-options', async () => {
    try {
      await editor().fill('const exportOptions = true;');
      await settings('export');
      await page
        .locator('[data-setting=export-scale]')
        .getByRole('tab', {name: '1x', exact: true})
        .click();
      await closeSettings();
      const one = PNG.sync.read(await download('scale-1.png'));
      await settings('export');
      await page
        .locator('[data-setting=export-scale]')
        .getByRole('tab', {name: '2x', exact: true})
        .click();
      await closeSettings();
      const two = PNG.sync.read(await download('scale-2.png'));
      assert.ok(
        Math.abs(two.width - one.width * 2) <= 1 &&
          Math.abs(two.height - one.height * 2) <= 1,
      );
      await settings('export');
      await page
        .locator('[data-setting=export-format]')
        .getByRole('tab', {name: 'JPEG', exact: true})
        .click();
      await closeSettings();
      assert.equal(
        (await download('snippet.jpeg')).subarray(0, 3).toString('hex'),
        'ffd8ff',
      );
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
      await page.locator('[data-export-menu]').click();
      await page.locator('[data-export-action="alt"]').click();
      assert.match(
        await page.evaluate(() => navigator.clipboard.readText()),
        /exportOptions/,
      );
    } finally {
      await doctor('/', 'editor', 'inspector');
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
    }
  });
  await feature('settings-persistence', async () => {
    try {
      await settings('experiments');
      await page.getByRole('radio', {name: /^Dock /}).focus();
      await page.keyboard.press('Space');
      await page.getByRole('radio', {name: /^Orb /}).focus();
      await page.keyboard.press('Space');
      await closeSettings();
      await doctor('/');
      await settings('experiments');
      assert.equal(
        await page.getByRole('radio', {name: /^Dock /}).isChecked(),
        true,
      );
      assert.equal(
        await page.getByRole('radio', {name: /^Orb /}).isChecked(),
        true,
      );
      await page
        .getByRole('button', {name: 'Restore defaults', exact: true})
        .click();
      assert.equal(
        await page.getByRole('radio', {name: /^Inspector /}).isChecked(),
        true,
      );
      assert.equal(
        await page.getByRole('radio', {name: /^Window /}).isChecked(),
        true,
      );
      assert.equal(
        await page
          .getByRole('button', {name: 'Restore defaults', exact: true})
          .isDisabled(),
        true,
      );
      const search = page.getByRole('textbox', {
        name: 'Search settings',
        exact: true,
      });
      await search.fill('zzqx');
      assert.match(
        await page.locator('[data-settings-body] [role=status]').innerText(),
        /No settings match/,
      );
      await closeSettings();
    } finally {
      await doctor('/', 'editor', 'inspector');
      await settings('experiments');
      const restore = page.getByRole('button', {
        name: 'Restore defaults',
        exact: true,
      });
      if (await restore.isEnabled()) await restore.click();
      await closeSettings();
    }
  });
  await feature('annotations', async () => {
    const code = 'const annotated = 1; // [!code ++]';
    await editor().fill('');
    await page.evaluate(text => navigator.clipboard.writeText(text), code);
    await editor().click();
    await editor().press('ControlOrMeta+v');
    await editor().locator('[data-mark=added]').first().waitFor();
    assert.doesNotMatch(await editor().innerText(), /\[!code/);
    await editor().press('ControlOrMeta+Home');
    await editor().press('ControlOrMeta+Alt+4');
    assert.equal(await editor().locator('[data-focused=true]').count(), 1);
    await editor().press('ControlOrMeta+Alt+0');
    assert.equal(await editor().locator('[data-focused=true]').count(), 0);
  });
  await feature('signature-management', async () => {
    await section('frame');
    await page.locator('#signature-options').click();
    await page
      .getByPlaceholder('@handle or profile link', {exact: true})
      .fill('@managed');
    await page.getByRole('tab', {name: 'Pill', exact: true}).click();
    assert.equal(
      await page
        .locator('[data-frame-signature]')
        .first()
        .getAttribute('data-signature-style'),
      'pill',
    );
    await page
      .getByRole('button', {name: 'Saved signatures', exact: true})
      .click();
    await page
      .getByRole('menuitem', {name: 'Save as new', exact: true})
      .click();
    await page
      .getByRole('group', {name: 'Signature name', exact: true})
      .getByRole('textbox')
      .fill('Management signature');
    await page.getByRole('button', {name: 'Save', exact: true}).click();

    await page
      .getByRole('button', {name: 'Saved signatures', exact: true})
      .click();
    await page.getByRole('menuitem', {name: 'Rename', exact: true}).click();
    await page
      .getByRole('group', {name: 'Signature name', exact: true})
      .getByRole('textbox')
      .fill('Renamed signature');
    await page.getByRole('button', {name: 'Save', exact: true}).click();
    await page
      .getByRole('button', {name: 'Saved signatures', exact: true})
      .click();
    await page.getByRole('menuitem', {name: /Renamed signature/}).waitFor();
    await page.getByRole('menuitem', {name: 'Delete', exact: true}).click();
    await page
      .getByRole('button', {name: 'Saved signatures', exact: true})
      .click();
    assert.equal(
      await page.getByRole('menuitem', {name: /Renamed signature/}).count(),
      0,
    );
  });
  await feature('editor-options', async () => {
    await editor().fill('const unchanged = 1;');
    await section('editor');
    const language = page.locator('#inspector-editor-language-trigger');
    await language.click();
    await page.getByRole('option', {name: 'Python', exact: true}).click();
    assert.match(await language.innerText(), /Python/);
    assert.equal(await editor().innerText(), 'const unchanged = 1;');
    await language.click();
    await page.getByRole('option', {name: /^Typescript$/i}).click();
    assert.match(await language.innerText(), /Typescript/i);
    await editor().fill('const value={answer:42}');
    await page.getByRole('button', {name: 'Format code', exact: true}).click();
    await page.waitForFunction(() =>
      document
        .querySelector('.cm-content[contenteditable="true"]')
        ?.textContent.includes('const value ='),
    );
    assert.match(await editor().innerText(), /const value = \{.*answer: 42/);
  });
  await feature('preset-management', async () => {
    await doctor('/', 'editor', 'studio');
    await page.getByRole('button', {name: 'Presets', exact: true}).click();
    await page
      .getByRole('button', {name: 'Add preset', exact: true})
      .first()
      .click();
    const add = page.getByRole('alertdialog', {
      name: 'Add a new preset',
      exact: true,
    });
    await add.getByRole('textbox').fill('Managed preset');
    await add.getByRole('button', {name: 'Confirm', exact: true}).click();
    const item = name => page.locator('li').filter({hasText: name});
    await item('Managed preset')
      .getByRole('button', {name: 'Preset menu', exact: true})
      .click();
    await page.getByRole('menuitem', {name: 'Rename', exact: true}).click();
    const rename = page.getByRole('alertdialog', {
      name: 'Rename preset',
      exact: true,
    });
    await rename.getByRole('textbox').fill('Renamed preset');
    await rename.getByRole('button', {name: 'Confirm', exact: true}).click();
    await item('Renamed preset').waitFor();
    await item('Managed preset').waitFor({state: 'hidden'});
    let savedPreset;
    for (let i = 0; i < 50; i++) {
      savedPreset = (await storedPresets())?.find(
        preset => preset.name === 'Renamed preset',
      );
      if (savedPreset) break;
      await page.waitForTimeout(100);
    }
    assert.ok(savedPreset, 'renamed preset persisted');
    await item('Renamed preset')
      .getByRole('button', {name: 'Preset menu', exact: true})
      .click();
    await page.getByRole('menuitem', {name: 'Delete', exact: true}).click();
    await page
      .getByRole('alertdialog', {name: 'Delete preset', exact: true})
      .getByRole('button', {name: 'Confirm', exact: true})
      .click();
    await item('Renamed preset').waitFor({state: 'hidden'});
    const deleted = async () =>
      !(await storedPresets())?.some(preset => preset.id === savedPreset.id);
    for (let i = 0; i < 50 && !(await deleted()); i++)
      await page.waitForTimeout(100);
    assert.ok(await deleted(), 'preset deletion persisted before reload');
    await page.reload();
    await editor().waitFor();
    await page.getByRole('button', {name: 'Presets', exact: true}).click();
    assert.equal(await item('Renamed preset').count(), 0);
  });
  await feature('animate', async () => {
    // The Editor window names its Add tab button; the default one does not.
    await windowStyle('Editor');
    await editor().fill('const step = 1;');
    await page
      .locator('[data-window-tabs]')
      .filter({has: page.getByRole('button', {name: 'Add tab', exact: true})})
      .first()
      .getByRole('button', {name: 'Add tab', exact: true})
      .click();
    await editor().fill('const step = 1;\nconst next = 2;');
    const toggle = page.locator('[data-animate-toggle]');
    const panel = page.locator('[data-animate-panel]');
    const stage = page.locator('[data-animation-stage]:visible');
    const track = page.locator('[data-animation-track]');
    const hold = page
      .locator('[data-animation-segment][data-kind="hold"]')
      .first();
    const open = async () => {
      await toggle.click();
      await panel.waitFor();
      assert.equal(await toggle.getAttribute('aria-pressed'), 'true');
    };
    await open();
    const kinds = await page
      .locator('[data-animation-segment]')
      .evaluateAll(segments => segments.map(segment => segment.dataset.kind));
    assert.ok(kinds.length >= 3, 'two steps or more');
    assert.ok(
      kinds.every((kind, i) => kind === (i % 2 ? 'transition' : 'hold')),
      'holds and transitions alternate',
    );
    await panel
      .getByRole('button', {name: 'Play animation', exact: true})
      .click();
    await stage.waitFor();
    await page.locator('[data-preview-pill]').waitFor();
    await page.waitForFunction(
      () =>
        parseFloat(
          document.querySelector('[data-animation-time]')?.textContent ?? '0',
        ) > 0,
    );
    await shot('animate-playing');
    await page.locator('[data-preview-pill]').click();
    await stage.waitFor({state: 'hidden'});
    assert.ok(
      await editor().evaluate(element => element === document.activeElement),
      'the pill returns the focus to the code',
    );
    const value = async locator =>
      Number(await locator.getAttribute('aria-valuenow'));
    const axis = async () => Number(await track.getAttribute('data-axis-ms'));
    const [before, total] = [await value(hold), await axis()];
    const handle = await hold.locator('[data-segment-resize]').boundingBox();
    const [x, y] = [handle.x + handle.width / 2, handle.y + handle.height / 2];
    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.mouse.move(x + 60, y, {steps: 4});
    await page.mouse.move(x + 120, y, {steps: 4});
    const dragged = await value(hold);
    assert.ok(dragged > before && dragged % 100 === 0, 'snaps to 100 ms');
    assert.equal(await axis(), total, 'the axis is frozen during the drag');
    await page.mouse.up();
    assert.equal(await value(hold), dragged);
    assert.equal(await axis(), total + dragged - before);
    // The save is debounced, so a reload right after the drag would lose it.
    // waitForFunction takes a promise as true: poll the stored value here.
    const savedHold = () =>
      page.evaluate(
        () =>
          new Promise(resolve => {
            const request = indexedDB.open('keyval-store');
            request.onsuccess = () => {
              const read = request.result
                .transaction('keyval')
                .objectStore('keyval')
                .get('document');
              read.onsuccess = () =>
                resolve(read.result?.animation?.steps?.[0]?.holdMs);
            };
          }),
      );
    for (let i = 0; i < 50 && (await savedHold()) !== dragged; i++)
      await page.waitForTimeout(100);
    assert.equal(await savedHold(), dragged, 'the drag saves the document');
    await page.reload();
    await editor().waitFor();
    await open();
    assert.equal(await value(hold), dragged, 'the resize survives a reload');
    await panel
      .getByRole('button', {name: 'Close animation', exact: true})
      .click();
    await panel.waitFor({state: 'hidden'});
  });
  async function animationFixture() {
    await windowStyle('Editor');
    await editor().fill('const first = 1;');
    await page
      .locator('[data-window-tabs]')
      .filter({
        has: page.getByRole('button', {name: 'Add tab', exact: true}),
      })
      .first()
      .getByRole('button', {name: 'Add tab', exact: true})
      .click();
    await editor().fill('const second = 2;');
    await page.locator('[data-animate-toggle]').click();
    await page.locator('[data-animate-panel]').waitFor();
    const saved = () =>
      page.evaluate(
        () =>
          new Promise(resolve => {
            const request = indexedDB.open('keyval-store');
            request.onsuccess = () => {
              const read = request.result
                .transaction('keyval')
                .objectStore('keyval')
                .get('document');
              read.onsuccess = () => {
                request.result.close();
                resolve(read.result?.animation?.steps?.length === 2);
              };
            };
          }),
      );
    for (let i = 0; i < 50 && !(await saved()); i++)
      await page.waitForTimeout(100);
    assert.equal(await saved(), true, 'animation fixture saved before reload');
  }
  async function animationMatrix(caseName, run) {
    const original = page;
    try {
      for (const layout of ['inspector', 'dock', 'studio']) {
        for (const viewport of [
          {width: 1440, height: 900},
          {width: 390, height: 844},
        ]) {
          const isolated = await createMockContext(context.browser(), base, {
            viewport,
            hasTouch: true,
            locale: 'en-US',
          });
          await isolated.tracing.start({snapshots: true});
          page = await isolated.newPage();
          page.setDefaultTimeout(12000);
          await page.addLocatorHandler(
            page.locator('[data-whats-new="nudge"]'),
            async nudge => {
              await nudge
                .getByRole('button', {name: "Dismiss what's new", exact: true})
                .click();
              await nudge.waitFor({state: 'hidden'});
            },
          );
          const warnings = [];
          const errors = [];
          page.on('pageerror', error => errors.push(String(error)));
          page.on('console', message => {
            if (
              /computations created outside|nonexistent droppable/i.test(
                message.text(),
              )
            )
              warnings.push(message.text());
          });
          await page.addInitScript(() => {
            const warn = console.warn;
            console.warn = (...args) =>
              warn(...args, new Error('warning source').stack);
          });
          const name = `${layout}-${viewport.width}`;
          console.log(`RUN animate-${caseName} ${name}`);
          try {
            await page.setViewportSize({width: 1440, height: 900});
            await doctor('/', 'editor', 'inspector');
            await animationFixture();
            await page.evaluate(
              layout =>
                localStorage.setItem(
                  'codeimage:editor-settings',
                  JSON.stringify({layout}),
                ),
              layout,
            );
            await page.setViewportSize(viewport);
            await page.reload();
            await editor().waitFor();
            await page.locator('[data-animate-toggle]').click();
            await page.locator('[data-animate-panel]').waitFor();
            await run({layout, viewport, name});
            assert.deepEqual(errors, [], `${name}: no page errors`);
            assert.deepEqual(
              warnings,
              [],
              `${name}: no Solid ownership warnings`,
            );
            await shot(`animate-${caseName}-${name}`);
            console.log(`PASS animate matrix ${name}`);
          } catch (error) {
            await shot(`animate-${caseName}-${name}-failure`).catch(() => {});
            await writeFile(
              resolve(out, `animate-${caseName}-${name}-failure.txt`),
              String(error) +
                '\n' +
                warnings.join('\n') +
                '\n' +
                (await page.locator('body').ariaSnapshot()),
            );
            throw error;
          } finally {
            await isolated.tracing.stop({
              path: resolve(out, `animate-${caseName}-${name}.zip`),
            });
            await isolated.close();
          }
        }
      }
    } finally {
      page = original;
    }
  }
  const animationSegments = () => page.locator('[data-animation-segment]');
  const durationInput = () => page.locator('#animationDuration-input');
  async function typeDuration(value, key = 'Enter') {
    await durationInput().focus();
    await page.keyboard.press('ControlOrMeta+A');
    await page.keyboard.type(String(value));
    await page.keyboard.press(key);
  }
  async function animationMenu(name) {
    await page.getByRole('button', {name: 'Steps', exact: true}).click();
    await page.getByRole('menuitem', {name, exact: true}).click();
    await page.locator('[role=menu]').waitFor({state: 'hidden'});
  }
  await feature('animate-focus', async () => {
    await animationMatrix('focus', async ({viewport, name}) => {
      const transition = animationSegments().nth(1);
      const hold = animationSegments().first();
      await transition.click();
      await durationInput().focus();
      await page.keyboard.press('Tab');
      assert.equal(
        await page
          .locator('[data-easing-trigger]')
          .evaluate(el => el === document.activeElement),
        true,
        'Tab skips the transient number steppers and reaches Easing',
      );
      await page.keyboard.press('Shift+Tab');
      assert.ok(
        await durationInput().evaluate(el => el === document.activeElement),
      );
      const before = Number(await transition.getAttribute('aria-valuenow'));
      await typeDuration(before + 200, 'Escape');
      assert.equal(
        Number(await transition.getAttribute('aria-valuenow')),
        before,
        'Escape reverts duration',
      );
      assert.equal(
        (await durationInput().inputValue()).replace(/\D/g, ''),
        String(before),
      );
      assert.equal(
        await transition.getAttribute('data-selected'),
        '',
        'Escape keeps the selection',
      );
      assert.ok(
        await durationInput().evaluate(el => el === document.activeElement),
      );
      const increment = page.getByRole('button', {
        name: 'Increase duration by 100 ms',
        exact: true,
      });
      await page.keyboard.press('ArrowUp');
      assert.equal(
        Number(await transition.getAttribute('aria-valuenow')),
        before + 100,
        'keyboard increment commits',
      );
      await page.keyboard.press('ArrowDown');
      assert.equal(
        Number(await transition.getAttribute('aria-valuenow')),
        before,
        'keyboard decrement commits',
      );
      if (viewport.width === 390) {
        await shot('animate-duration-touch');
        for (const label of [
          'Increase duration by 100 ms',
          'Decrease duration by 100 ms',
        ]) {
          const button = page.getByRole('button', {name: label, exact: true});
          const box = await button.boundingBox();
          assert.ok(
            box.width >= 40 && box.height >= 40,
            'duration stepper touch target',
          );
          assert.ok(
            await button.evaluate(el => {
              const b = el.getBoundingClientRect();
              return el.contains(
                document.elementFromPoint(
                  b.x + b.width / 2,
                  b.y + b.height / 2,
                ),
              );
            }),
            'duration stepper can be hit',
          );
        }
        await page.locator('[data-easing-trigger]').click();
        const easing = page.getByRole('dialog', {name: 'Easing', exact: true});
        await easing.evaluate(element =>
          Promise.all(
            element.getAnimations().map(animation => animation.finished),
          ),
        );
        const touchTargets = [];
        for (const control of [
          easing.getByRole('tab', {name: 'Smooth', exact: true}),
          easing.getByRole('button', {name: 'Play transition', exact: true}),
        ]) {
          const box = await control.boundingBox();
          const minimum = await control.evaluate(element => ({
            height: getComputedStyle(element).minHeight,
            width: getComputedStyle(element).minWidth,
          }));
          assert.equal(minimum.height, '40px', 'easing target minimum height');
          assert.equal(minimum.width, '40px', 'easing target minimum width');
          assert.ok(
            box.width >= 39.99 && box.height >= 39.99,
            `easing touch target: ${JSON.stringify(box)}`,
          );
          touchTargets.push({box, minimum});
        }
        await writeFile(
          resolve(out, `animate-touch-${name}.json`),
          JSON.stringify(touchTargets, null, 2),
        );
        await easing.getByRole('tab', {name: 'Smooth', exact: true}).focus();
        await page.keyboard.press('Escape');
        await easing.waitFor({state: 'hidden'});
        await durationInput().focus();
      }
      if (viewport.width === 390) await increment.tap();
      else await increment.click();
      assert.equal(
        Number(await transition.getAttribute('aria-valuenow')),
        before + 100,
        'stepper commits immediately',
      );
      await page
        .getByRole('button', {name: 'Apply to all', exact: true})
        .focus();
      await page.keyboard.press('Enter');
      assert.ok(
        await page
          .getByRole('button', {name: 'Apply to all', exact: true})
          .evaluate(el => el === document.activeElement),
        'Apply to all retains keyboard focus',
      );
      await hold.click();
      await transition.click();
      await hold.click();
      await animationMenu('Duplicate as next step');
      await page.waitForFunction(() =>
        document.activeElement?.classList.contains('cm-content'),
      );
      assert.ok(
        (await editor().innerText()).includes('const first = 1;'),
        'duplicate code holds focus',
      );
      if (viewport.width === 390) {
        for (const name of ['Play animation', 'Close animation']) {
          const box = await page
            .getByRole('button', {name, exact: true})
            .boundingBox();
          assert.ok(
            box.width >= 40 && box.height >= 40,
            `${name}: 40px touch target`,
          );
        }
        assert.ok(
          (
            await page
              .getByRole('slider', {name: 'Playhead', exact: true})
              .boundingBox()
          ).height >= 40,
        );
      }
    });
  });

  async function addAnimationStep() {
    await page.getByRole('button', {name: 'Steps', exact: true}).click();
    await page
      .getByRole('menuitem', {name: 'Add to animation', exact: true})
      .hover();
    const submenu = page.getByRole('menu').last();
    await submenu
      .getByRole('menuitem', {name: 'index.tsx', exact: true})
      .click();
    await page.waitForFunction(() => !document.querySelector('[role=menu]'));
  }
  async function visibleInStrip(locator) {
    return locator.evaluate(element => {
      const box = element.getBoundingClientRect();
      const root = element
        .closest('[data-animation-scroller]')
        .getBoundingClientRect();
      return box.x >= root.x - 1 && box.right <= root.right + 1;
    });
  }
  await feature('animate-geometry', async () => {
    await animationMatrix('geometry', async ({viewport, name}) => {
      const hold = animationSegments().first();
      const transition = animationSegments().nth(1);
      const ruler = page.getByRole('slider', {name: 'Playhead', exact: true});
      const scroller = page.locator('[data-animation-scroller]');
      await hold.click();
      const handle = await hold.locator('[data-segment-resize]').boundingBox();
      const x = handle.x + handle.width / 2;
      const y = handle.y + handle.height / 2;
      await page.mouse.move(x, y);
      await page.mouse.down();
      await page.mouse.move(x - 1200, y, {steps: 8});
      await page.mouse.up();
      assert.equal(await hold.getAttribute('aria-valuenow'), '0');
      assert.ok(
        (await hold.boundingBox()).width >= 8,
        'zero hold keeps a visible slot',
      );
      await transition.click();
      await hold.click();
      assert.equal(
        await hold.getAttribute('data-selected'),
        '',
        'zero hold selectable with a click',
      );
      if (viewport.width === 390) {
        await transition.tap();
        await hold.tap();
        assert.equal(
          await hold.getAttribute('data-selected'),
          '',
          'zero hold selectable with touch',
        );
        assert.ok(
          (await hold.locator('[data-segment-resize]').boundingBox()).width >=
            40,
        );
      }
      await typeDuration(10000);
      await transition.click();
      await typeDuration(100);
      await page
        .getByRole('button', {name: 'Apply to all', exact: true})
        .click();
      await animationSegments().last().click();
      await typeDuration(100);
      let count = 2;
      const measurements = [];
      for (const target of [3, 8, 40]) {
        while (count < target) {
          await addAnimationStep();
          count++;
          assert.equal(
            await animationSegments().last().getAttribute('data-selected'),
            '',
          );
          assert.ok(
            await visibleInStrip(animationSegments().last()),
            'new step scrolls into view',
          );
          await typeDuration(100);
        }
        assert.equal(await animationSegments().count(), target * 2 - 1);
        const tickDrift = await page.evaluate(() => {
          const segments = [
            ...document.querySelectorAll('[data-animation-segment]'),
          ];
          const axis = document
            .querySelector('[data-animation-track]')
            .getBoundingClientRect();
          const rows = segments.map(element => ({
            x: element.getBoundingClientRect().left - axis.left,
            width: element.getBoundingClientRect().width,
            ms: Number(element.getAttribute('aria-valuenow')),
          }));
          return [...document.querySelectorAll('[data-animation-tick]')].map(
            tick => {
              const ms = Number(tick.dataset.animationTick);
              let start = 0;
              const row = rows.find(row => {
                if (ms < start + row.ms) return true;
                start += row.ms;
                return false;
              });
              const expected = row
                ? row.x + ((ms - start) / row.ms) * row.width
                : axis.width;
              return Math.abs(
                parseFloat(getComputedStyle(tick).left) - expected,
              );
            },
          );
        });
        assert.ok(
          Math.max(...tickDrift) < 1,
          `${target} steps: ruler ticks share segment geometry`,
        );
        const indices = [
          ...new Set([
            1,
            2,
            Math.floor(target / 2) * 2 - 1,
            target * 2 - 3,
            target * 2 - 2,
          ]),
        ];
        for (const index of indices) {
          const segment = animationSegments().nth(index);
          await segment.scrollIntoViewIfNeeded();
          const box = await segment.boundingBox();
          const rulerBox = await ruler.boundingBox();
          const durations = await animationSegments().evaluateAll(elements =>
            elements.map(el => Number(el.getAttribute('aria-valuenow'))),
          );
          const expected =
            durations.slice(0, index).reduce((sum, ms) => sum + ms, 0) +
            durations[index] / 2;
          await page.mouse.click(
            box.x + box.width / 2,
            rulerBox.y + rulerBox.height / 2,
          );
          assert.equal(
            await segment.getAttribute('data-current'),
            '',
            `${target} steps: ruler selects the segment under the pointer`,
          );
          const actual = Number(await ruler.getAttribute('aria-valuenow'));
          assert.ok(
            Math.abs(actual - expected) <= durations[index] / box.width + 2,
            `${target} steps: pointer time matches its segment`,
          );
        }
        await page
          .getByRole('button', {name: 'Stop and edit the code', exact: true})
          .click();
        measurements.push({
          steps: target,
          maxTickDrift: Math.max(...tickDrift),
        });
      }
      await hold.scrollIntoViewIfNeeded();
      await hold.click();
      await typeDuration(100);
      await scroller.evaluate(el => {
        el.scrollLeft = 0;
      });
      await page
        .getByRole('button', {name: 'Play animation', exact: true})
        .click();
      await page.waitForFunction(
        () =>
          document.querySelector('[data-animation-scroller]').scrollLeft > 100,
      );
      const root = await scroller.boundingBox();
      await page.mouse.move(root.x + root.width / 2, root.y + root.height / 2);
      await page.mouse.wheel(-120, 0);
      await page.waitForTimeout(100);
      const manuallyScrolled = await scroller.evaluate(el => el.scrollLeft);
      await page.waitForTimeout(250);
      assert.equal(
        await scroller.evaluate(el => el.scrollLeft),
        manuallyScrolled,
        'playback respects a user scroll',
      );
      await page.waitForTimeout(1400);
      for (let i = 0; i < 10; i++) {
        assert.ok(
          await visibleInStrip(page.locator('[data-animation-playhead]')),
          'playhead follows in the scrolling strip',
        );
        await page.waitForTimeout(100);
      }
      await page.waitForFunction(
        () => {
          const ruler = document.querySelector(
            '[data-animate-panel] [aria-label="Playhead"]',
          );
          return (
            Number(ruler?.getAttribute('aria-valuenow')) ===
            Number(ruler?.getAttribute('aria-valuemax'))
          );
        },
        null,
        {timeout: 15000},
      );
      assert.ok(
        await visibleInStrip(page.locator('[data-animation-playhead]')),
        'the final paused playhead stays visible',
      );
      await page
        .getByRole('button', {name: 'Stop and edit the code', exact: true})
        .click();
      // Select through the keyboard, without Playwright scrolling a locator.
      await animationSegments().first().focus();
      await page.keyboard.press('End');
      assert.ok(
        await visibleInStrip(animationSegments().last()),
        'keyboard selection stays visible',
      );
      const scrollBox = await scroller.boundingBox();
      await page.mouse.move(
        scrollBox.x + scrollBox.width / 2,
        scrollBox.y + scrollBox.height / 2,
      );
      await page.mouse.wheel(-160, 0);
      await addAnimationStep();
      assert.ok(
        await visibleInStrip(animationSegments().last()),
        'added step stays visible after playback',
      );
      await writeFile(
        resolve(out, `animate-geometry-${name}.json`),
        JSON.stringify(measurements, null, 2),
      );
    });
  });

  await auditSnippets({feature, doctor, context, base, out});
  await feature('projects', async () => {
    await page
      .getByRole('button', {name: 'Sign in with GitHub', exact: true})
      .click();
    await page
      .getByRole('button', {name: 'New', exact: true})
      .first()
      .waitFor();
    const created = page.waitForResponse(
      r =>
        r.request().method() === 'POST' &&
        new URL(r.url()).pathname === '/api/v1/project',
    );
    await page.getByRole('button', {name: 'New', exact: true}).first().click();
    const project = await (await created).json();
    assert.ok(project.id);
    await editor().waitFor();
    const api = (path = '', method = 'GET', body, owner) =>
      page.evaluate(
        async ({path, method, body, owner}) => {
          const response = await fetch('/api/v1/project' + path, {
            method,
            headers: {
              'Content-Type': 'application/json',
              ...(owner ? {'auth-mock-user-id': owner} : {}),
            },
            body: body === undefined ? undefined : JSON.stringify(body),
          });
          const text = await response.text();
          return {
            status: response.status,
            body: text ? JSON.parse(text) : null,
          };
        },
        {path, method, body, owner},
      );
    const saved = page.waitForResponse(
      r =>
        r.request().method() === 'PUT' &&
        new URL(r.url()).pathname === `/api/v1/project/${project.id}`,
    );
    await editor().fill('const persisted = "verification";');
    assert.equal((await saved).status(), 200);
    assert.equal(
      (await api(`/${project.id}`)).body.editorTabs[0].code,
      'const persisted = "verification";',
    );
    const [reloaded] = await Promise.all([
      page.waitForResponse(
        r =>
          r.request().method() === 'GET' &&
          new URL(r.url()).pathname === `/api/v1/project/${project.id}`,
        {timeout: 60000},
      ),
      page.reload(),
    ]);
    assert.equal(
      (await reloaded.json()).editorTabs[0].code,
      'const persisted = "verification";',
    );
    await editor().waitFor();
    assert.equal(
      await editor().innerText(),
      'const persisted = "verification";',
    );
    await page.goto(base + '/dashboard');
    await page.locator(`a[href="/${project.id}"]`).click();
    await editor().waitFor();
    assert.equal(
      await editor().innerText(),
      'const persisted = "verification";',
    );
    const lateContext = await createMockContext(context.browser(), base, {
      viewport: {width: 1440, height: 1000},
      storageState: await context.storageState({indexedDB: true}),
    });
    try {
      await lateContext.addInitScript(() =>
        sessionStorage.setItem(
          '_mockAuth',
          JSON.stringify({authenticated: true}),
        ),
      );
      const latePage = await lateContext.newPage();
      latePage.setDefaultTimeout(60000);
      let lateStarts = 0;
      await latePage.route(
        url => url.pathname === '/src/mocks/browser.ts',
        async route => {
          await latePage.waitForFunction(
            () => document.readyState === 'complete',
          );
          lateStarts++;
          await route.continue();
        },
      );
      await latePage.goto(`${base}/${project.id}`);
      const lateEditor = latePage
        .locator('.cm-content[contenteditable="true"]')
        .first();
      await lateEditor.waitFor();
      assert.equal(
        await lateEditor.innerText(),
        'const persisted = "verification";',
      );
      assert.equal(lateStarts, 1);
      await latePage.screenshot({path: resolve(out, 'mock-late-start.png')});
    } finally {
      await lateContext.close();
    }
    assert.equal(
      (await api(`/${project.id}`, 'DELETE', undefined, 'another-user')).status,
      404,
    );
    await page.goto(base);
    const card = id =>
      page.locator('li').filter({has: page.locator(`a[href="/${id}"]`)});
    await card(project.id)
      .getByRole('button', {name: 'Menu', exact: true})
      .click();
    await page.getByRole('menuitem', {name: 'Rename', exact: true}).click();
    const rename = page.getByRole('dialog', {
      name: 'Rename project',
      exact: true,
    });
    await rename.getByRole('textbox').fill('Renamed verification');
    const [renamed] = await Promise.all([
      page.waitForResponse(
        r =>
          r.request().method() === 'PUT' &&
          new URL(r.url()).pathname === `/api/v1/project/${project.id}/name`,
      ),
      rename.getByRole('button', {name: 'Confirm', exact: true}).click(),
    ]);
    assert.equal(renamed.status(), 200);
    assert.ok(
      (await api()).body.some(
        item => item.id === project.id && item.name === 'Renamed verification',
      ),
    );
    await page.reload();
    await card(project.id)
      .getByText('Renamed verification', {exact: true})
      .waitFor();
    await card(project.id)
      .getByRole('button', {name: 'Menu', exact: true})
      .click();
    const [cloned] = await Promise.all([
      page.waitForResponse(
        r =>
          r.request().method() === 'POST' &&
          new URL(r.url()).pathname === `/api/v1/project/${project.id}/clone`,
      ),
      page.getByRole('menuitem', {name: 'Clone', exact: true}).click(),
    ]);
    assert.equal(cloned.status(), 200);
    const clone = await cloned.json();
    assert.notEqual(clone.id, project.id);
    await page.waitForURL(`${base}/${clone.id}`);
    await editor().waitFor();
    assert.equal(
      await editor().innerText(),
      'const persisted = "verification";',
    );
    await page.goto(base);
    await card(clone.id).waitFor();
    assert.ok((await api()).body.some(item => item.id === clone.id));
    assert.equal(
      (await api(`/${clone.id}`)).body.editorTabs[0].code,
      'const persisted = "verification";',
    );
    await shot('project-cloned');
    for (const id of [clone.id, project.id]) {
      await card(id).getByRole('button', {name: 'Menu', exact: true}).click();
      await page.getByRole('menuitem', {name: 'Delete', exact: true}).click();
      const dialog = page.getByRole('dialog', {
        name: 'Delete project',
        exact: true,
      });
      const [removed] = await Promise.all([
        page.waitForResponse(
          r =>
            r.request().method() === 'DELETE' &&
            new URL(r.url()).pathname === `/api/v1/project/${id}`,
        ),
        dialog.getByRole('button', {name: 'Confirm', exact: true}).click(),
      ]);
      assert.equal(removed.status(), 200);
      const [listed] = await Promise.all([
        page.waitForResponse(
          r =>
            r.request().method() === 'GET' &&
            new URL(r.url()).pathname === '/api/v1/project',
        ),
        page.reload(),
      ]);
      assert.equal(listed.status(), 200);
      assert.ok(!(await listed.json()).some(item => item.id === id));
      await page
        .getByRole('button', {name: 'New', exact: true})
        .first()
        .waitFor();
      assert.equal(await card(id).count(), 0);
      assert.equal((await api(`/${id}`)).status, 404);
    }
    assert.equal(
      (await api(`/${project.id}/name`, 'PUT', {name: 'Missing'})).status,
      404,
    );
    assert.equal((await api(`/${project.id}`, 'DELETE')).status, 404);
    assert.ok(!(await api()).body.some(item => item.id === project.id));
    await writeFile(
      resolve(out, 'project.json'),
      JSON.stringify({id: project.id, url: page.url()}, null, 2),
    );
  });
  for (const name of requested)
    assert.ok(
      results.some(result => result.feature === name),
      `Unknown case: ${name}`,
    );
  assert.ok(
    results.every(r => r.status === 'passed'),
    'Audit has failed features; inspect audit.json',
  );
}
