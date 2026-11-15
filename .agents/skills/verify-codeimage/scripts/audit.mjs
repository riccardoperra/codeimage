#!/usr/bin/env node
import assert from 'node:assert/strict';
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
  const editor = () =>
    page.locator('.cm-content[contenteditable="true"]').first();
  const shot = name =>
    page.screenshot({path: resolve(out, `${name}.png`), fullPage: true});
  async function doctor(route = '/') {
    assert.equal(server.exitCode, null);
    assert.ok((await fetch(base)).ok);
    await page.goto(base + route);
    await editor().waitFor();
    const close = page.getByRole('button', {name: 'close', exact: true});
    if (await close.isVisible()) await close.click();
    await page.evaluate(() => document.fonts.ready);
    assert.ok(await editor().isVisible());
  }
  async function feature(name, run) {
    try {
      await doctor('/?v=2');
      await run();
      await shot(name);
      results.push({feature: name, status: 'passed'});
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
      // Reset the wedged UI and re-doctor before the next independent feature.
      await doctor('/?v=2');
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
  await feature('editor', async () => {
    for (const route of ['/?v=2', '/classic']) {
      await doctor(route);
      await editor().fill('const audit = 1;');
      await editor().press('End');
      await page.keyboard.type('x');
      await page.keyboard.press('ControlOrMeta+z');
      assert.equal(await editor().innerText(), 'const audit = 1;');
    }
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
    await page
      .locator('[data-control="window.surface"]')
      .getByRole('tab', {name: 'Accent wash', exact: true})
      .click();
  });
  await feature('tabs', async () => {
    await section('window');
    await page
      .locator('[data-control="window.style"]')
      .getByRole('button')
      .click();
    await page.getByRole('radio', {name: 'Editor', exact: true}).focus();
    await page.keyboard.press('Space');
    await page
      .getByRole('dialog', {name: 'Window', exact: true})
      .getByRole('button', {name: 'Close', exact: true})
      .click();
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
      page.getByRole('menuitem', {name: /^Export one image per tab/}).click(),
    ]);
    await zip.saveAs(resolve(out, 'tabs.zip'));
    const entries = Object.entries(
      unzipSync(await readFile(resolve(out, 'tabs.zip'))),
    );
    assert.equal(entries.length, 2);
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
    await closeSettings();
    assert.equal(await page.locator('#settings-rendering-engine').count(), 0);
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
    await warning.getByRole('button', {name: 'Close', exact: true}).click();
  });
  await feature('presets', async () => {
    await doctor('/?v=4');
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
    const saved = page.waitForResponse(
      r =>
        r.request().method() === 'PUT' &&
        new URL(r.url()).pathname === `/api/v1/project/${project.id}`,
    );
    await editor().fill('const persisted = "verification";');
    assert.equal((await saved).status(), 200);
    await page.reload();
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
    await writeFile(
      resolve(out, 'project.json'),
      JSON.stringify({id: project.id, url: page.url()}, null, 2),
    );
  });
  assert.ok(
    results.every(r => r.status === 'passed'),
    'Audit has failed features; inspect audit.json',
  );
}
