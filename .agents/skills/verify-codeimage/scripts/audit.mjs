#!/usr/bin/env node
import {animateTimelineCases} from './animate-timeline.mjs';
import {createDoctor} from './health/doctor.mjs';
import assert from 'node:assert/strict';
import {auditPresets, auditPresetPersistence} from './presets.mjs';
import {auditLineMarks} from './audit-line-marks.mjs';
import {auditLineMarksNews} from './audit-line-marks-news.mjs';
import {verifyKeyboardScroll} from './keyboard-scroll.mjs';
import {createMockContext} from './mock-context.mjs';
import {animationMp4Cases} from './animation-mp4.mjs';
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
  const saveResults = () =>
    writeFile(resolve(out, 'audit.json'), JSON.stringify(results, null, 2));
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
  const doctor = createDoctor({page: () => page, server, base});
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
      await saveResults();
      await doctor(
        '/',
        name === 'projects' ? 'dashboard' : 'editor',
        'inspector',
      );
    }
    await saveResults();
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
  async function fresh({name, layout, viewport, initialize, hasTouch}, run) {
    const previous = {page, context};
    context = await createMockContext(context.browser(), base, {
      viewport,
      hasTouch,
      locale: 'en-US',
      colorScheme: 'dark',
      permissions: ['clipboard-read', 'clipboard-write'],
    });
    try {
      await context.addInitScript(layout => {
        if (location.origin === 'null') return;
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
  await feature('keyboard-scroll', () => verifyKeyboardScroll({fresh, out}));
  const {auditFrameGeometry} = await import('./export-geometry.mjs');
  await auditFrameGeometry({feature, fresh, out});
  await feature('agent-tools', async () => {
    const {verifyAgentTools} = await import('./agent-tools.mjs');
    return verifyAgentTools({fresh, out});
  });
  await feature('local-ai', async () => {
    const {verifyLocalAi} = await import('./local-ai.mjs');
    return verifyLocalAi({fresh, out});
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
  await auditLineMarks({
    page,
    editor,
    section,
    out,
    feature,
    fresh,
    download,
    shot,
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
  await auditLineMarksNews({base, out, feature, fresh});
  // The current release is major, so a fresh profile gets the Showcase
  // sheet. Minimize turns it into the Nudge card, which steps through the
  // highlights, and a dismissal survives a reload.
  await feature('whats-new-nudge', () =>
    fresh(
      {
        name: 'whats-new-nudge',
        layout: 'inspector',
        viewport: {width: 1440, height: 900},
      },
      async ({page}) => {
        const ready = () =>
          page.locator('.cm-content[contenteditable="true"]').waitFor();
        await page.goto(base, {waitUntil: 'domcontentloaded'});
        await ready();
        const sheet = page.locator('[data-whats-new="showcase"]');
        await sheet.waitFor({timeout: 15000});
        await page
          .getByRole('button', {name: "Minimize what's new", exact: true})
          .click();
        await sheet.waitFor({state: 'hidden'});
        const nudge = page.locator('[data-whats-new="nudge"]');
        await nudge.waitFor();
        await page.screenshot({
          path: resolve(out, 'whats-new-nudge-collapsed.png'),
        });
        await nudge.getByRole('button', {name: 'See', exact: true}).click();
        const step = n =>
          nudge
            .getByRole('img', {name: new RegExp(`^Step ${n} of \\d+$`)})
            .waitFor();
        await step(1);
        await nudge.getByRole('button', {name: 'Next', exact: true}).click();
        await step(2);
        await page.screenshot({path: resolve(out, 'whats-new-nudge.png')});
        await nudge
          .getByRole('button', {name: "Dismiss what's new", exact: true})
          .click();
        await nudge.waitFor({state: 'hidden'});
        // The dismissal is an IndexedDB write. Reload only once it landed.
        // waitForFunction would pass at once on a promise, so poll here.
        const dismissed = () =>
          page.evaluate(
            () =>
              new Promise(done => {
                const open = indexedDB.open('keyval-store');
                open.onerror = () => done([]);
                open.onsuccess = () => {
                  const db = open.result;
                  const read = db
                    .transaction('keyval')
                    .objectStore('keyval')
                    .get('whats-new');
                  read.onsuccess = () => {
                    db.close();
                    done(read.result?.dismissed ?? []);
                  };
                  read.onerror = () => {
                    db.close();
                    done([]);
                  };
                };
              }),
          );
        const until = Date.now() + 5000;
        while ((await dismissed()).length === 0) {
          assert.ok(Date.now() < until, 'the dismissal reaches IndexedDB');
          await page.waitForTimeout(100);
        }
        await page.reload({waitUntil: 'domcontentloaded'});
        await ready();
        // The announcement arrives about 700 ms after the editor settles.
        await page.waitForTimeout(3000);
        assert.equal(
          await page
            .locator('[data-whats-new="showcase"], [data-whats-new="nudge"]')
            .count(),
          0,
          'a dismissed announcement stays away after a reload',
        );
      },
    ),
  );
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
    const renderer = page.locator('#settings-rendering-engine');
    if ((await renderer.getAttribute('aria-checked')) !== 'true') {
      await renderer.focus();
      await page.keyboard.press('Space');
    }
    await page.waitForFunction(
      () =>
        document
          .querySelector('#settings-rendering-engine')
          ?.getAttribute('aria-checked') === 'true',
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
  await feature('presets', () => auditPresets({page, doctor, editor, shot}));
  await feature('preset-persistence', () =>
    auditPresetPersistence({fresh, out}),
  );
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
        await page.getByRole('radio', {name: /^Sidebar /}).isChecked(),
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
    await section('code');
    const language = page.locator('#sidebar-editor-language-trigger');
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
  const mp4 = animationMp4Cases({
    page,
    context,
    out,
    base,
    doctor,
    editor,
    shot,
    section,
  });
  await feature('web-mp4', async () => {
    const {verifyWebMp4} = await import('./web-mp4/index.mjs');
    return fresh({name: 'web-mp4', layout: 'inspector'}, ({page}) =>
      verifyWebMp4({page, base, out}),
    );
  });
  await feature('animation-gif-estimates', mp4.gifEstimates);
  await feature('animation-gif', mp4.gifLayouts);
  await feature('animation-gif-fallback', mp4.gifFallback);
  await feature('animation-mp4', mp4.layouts);
  await feature('animation-mp4-errors', mp4.errors);
  await feature('animation-mp4-compositing', mp4.compositing);
  await feature('animation-mp4-modes', mp4.modes);
  await feature('animation-mp4-parity', mp4.parity);
  await feature('animation-mp4-step-size', mp4.stepSizeMp4);
  await feature('animation-gif-step-size', mp4.stepSizeGif);
  for (const [name, run] of animateTimelineCases({fresh, out}))
    await feature(name, run);
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
