import assert from 'node:assert/strict';
import {resolve} from 'node:path';
import {writeFile} from 'node:fs/promises';
import {isDeepStrictEqual} from 'node:util';
import {auditCodeMirrorPreview} from './codemirror-preview.mjs';
import {auditPresets} from './preset-reopen.mjs';

export async function auditPresetCases({feature, fresh, ...context}) {
  await feature('presets', () => auditPresets(context));
  const name = 'codemirror-preview';
  await feature(name, () =>
    fresh(
      {name, layout: 'inspector', viewport: {width: 1440, height: 900}},
      async ({page, doctor, section, editor}) => {
        await doctor('/', 'editor', 'inspector');
        return auditCodeMirrorPreview(page, section, editor);
      },
    ),
  );
}

async function stored(page, key) {
  return page.evaluate(
    key =>
      new Promise((resolve, reject) => {
        const request = indexedDB.open('keyval-store');
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          const database = request.result;
          const read = database
            .transaction('keyval')
            .objectStore('keyval')
            .get(key);
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
    key,
  );
}

async function waitForDocument(page, expected) {
  let actual;
  for (let attempt = 0; attempt < 50; attempt++) {
    actual = await stored(page, 'document');
    if (
      isDeepStrictEqual(actual?.editor.options, expected.editor) &&
      actual?.frame.padding === expected.frame.padding &&
      actual?.terminal.showWatermark === expected.terminal.showWatermark
    )
      return actual;
    await page.waitForTimeout(100);
  }
  assert.deepEqual(
    actual?.editor.options,
    expected.editor,
    'preset editor options saved',
  );
  assert.equal(
    actual?.frame.padding,
    expected.frame.padding,
    'preset frame saved',
  );
  assert.equal(
    actual?.terminal.showWatermark,
    expected.terminal.showWatermark,
    'preset terminal saved',
  );
  return actual;
}

async function chooseTheme(page, section, name) {
  await section('themes');
  await page
    .getByRole('textbox', {name: 'Search themes', exact: true})
    .fill(name);
  const option = page.getByRole('option', {
    name: `${name} Dark theme`,
    exact: true,
  });
  await option.click();
  await page.mouse.move(0, 0);
  return option.getAttribute('data-theme-option');
}

async function choosePadding(page, section, value) {
  await section('frame');
  await page
    .locator('[data-control="frame.padding"]')
    .getByRole('button')
    .click();
  await page.getByRole('option', {name: String(value), exact: true}).click();
}

const watermark = page =>
  page.locator('[data-control="window.watermark"]').getByRole('switch');
const appearance = page =>
  page
    .locator('[data-fit-scale] [data-surface]')
    .first()
    .evaluate(node => {
      const style = getComputedStyle(node);
      return {background: style.backgroundColor, text: style.color};
    });

async function createPreset({page, section}) {
  await chooseTheme(page, section, 'Dracula');
  await choosePadding(page, section, 128);
  await section('window');
  await watermark(page).press('Space');
  await section('presets');
  await page
    .getByRole('button', {name: 'Add preset', exact: true})
    .first()
    .click();
  const dialog = page.getByRole('alertdialog', {
    name: 'Add a new preset',
    exact: true,
  });
  await dialog.getByRole('textbox').fill('Persistence preset');
  await dialog.getByRole('button', {name: 'Confirm', exact: true}).click();
  await page.locator('li').filter({hasText: 'Persistence preset'}).waitFor();
  let preset;
  for (let attempt = 0; attempt < 50 && !preset; attempt++) {
    preset = (await stored(page, 'presets'))?.find(
      item => item.name === 'Persistence preset',
    );
    if (!preset) await page.waitForTimeout(100);
  }
  assert.ok(preset, 'preset saved');
  return preset;
}

async function checkApplied({
  page,
  editor,
  section,
  preset,
  out,
  name,
  projectId,
}) {
  const code = 'const presetKeepsCode = true;';
  await editor().fill(code);
  const changedThemeId = await chooseTheme(page, section, 'Night Owl');
  await choosePadding(page, section, 32);
  await section('window');
  if (!(await watermark(page).isChecked()))
    await watermark(page).press('Space');
  const changed = {
    ...preset.data,
    editor: {...preset.data.editor, themeId: changedThemeId},
    frame: {...preset.data.frame, padding: 32},
    terminal: {...preset.data.terminal, showWatermark: true},
  };
  await waitForDocument(page, changed);
  await section('presets');
  await page.screenshot({path: resolve(out, `${name}-before-apply.png`)});
  const pending = projectId
    ? page.waitForResponse(
        response =>
          response.request().method() === 'PUT' &&
          new URL(response.url()).pathname === `/api/v1/project/${projectId}` &&
          response.request().postDataJSON().editorOptions.themeId ===
            preset.data.editor.themeId,
      )
    : null;
  await page.locator('li').filter({hasText: 'Persistence preset'}).click();
  const saved = await waitForDocument(page, preset.data);
  assert.deepEqual(saved.frame, preset.data.frame);
  assert.deepEqual(saved.terminal, preset.data.terminal);
  const appliedAppearance = await appearance(page);
  await page.screenshot({path: resolve(out, `${name}-applied.png`)});
  if (pending) {
    assert.equal((await pending).status(), 200);
    const remote = await page.evaluate(
      async id => (await fetch(`/api/v1/project/${id}`)).json(),
      projectId,
    );
    assert.equal(remote.editorOptions.themeId, preset.data.editor.themeId);
    assert.equal(remote.frame.padding, preset.data.frame.padding);
    assert.equal(remote.terminal.background, preset.data.terminal.background);
    await writeFile(
      resolve(out, `${name}-api.json`),
      JSON.stringify(remote, null, 2),
    );
    assert.equal(remote.terminal.textColor, preset.data.terminal.textColor);
    assert.equal(
      remote.terminal.showWatermark,
      preset.data.terminal.showWatermark,
    );
  }
  await page.reload();
  await editor().waitFor();
  await section('themes');
  assert.equal(
    await page
      .getByRole('option', {name: 'Dracula Dark theme', exact: true})
      .getAttribute('aria-selected'),
    'true',
  );
  await page.mouse.move(0, 0);
  await section('frame');
  assert.match(
    await page.locator('[data-control="frame.padding"]').innerText(),
    /128/,
  );
  await section('window');
  assert.equal(
    await watermark(page).isChecked(),
    preset.data.terminal.showWatermark,
  );
  assert.equal(await editor().innerText(), code);
  const reloadedAppearance = await appearance(page);
  await page.screenshot({path: resolve(out, `${name}-after-reload.png`)});
  await writeFile(
    resolve(out, `${name}-state.json`),
    JSON.stringify(
      {
        expected: preset.data,
        document: await stored(page, 'document'),
        appliedAppearance,
        reloadedAppearance,
      },
      null,
      2,
    ),
  );
  assert.deepEqual(
    reloadedAppearance,
    appliedAppearance,
    'terminal renders the same colours after reload',
  );
  const reloaded = await waitForDocument(page, preset.data);
  assert.deepEqual(reloaded.frame, preset.data.frame);
  assert.deepEqual(reloaded.terminal, preset.data.terminal);
  await page.screenshot({path: resolve(out, `${name}-after-reload.png`)});
  return {
    mode: name,
    themeId: reloaded.editor.options.themeId,
    padding: reloaded.frame.padding,
    showWatermark: reloaded.terminal.showWatermark,
    appearance: appliedAppearance,
  };
}

async function createSnippet(page, context) {
  await context.route('**/api/v1/preset', route => route.fulfill({json: []}));
  await page
    .getByRole('button', {name: 'Sign in with GitHub', exact: true})
    .click();
  const add = page.getByRole('button', {name: 'New', exact: true}).first();
  await add.waitFor();
  const created = page.waitForResponse(
    response =>
      response.request().method() === 'POST' &&
      new URL(response.url()).pathname === '/api/v1/project',
  );
  await add.click();
  const project = await (await created).json();
  await page.locator('.unified-editor[data-page-state="owner"]').waitFor();
  await page
    .locator('[data-fit-scale] .cm-content[contenteditable="true"]')
    .waitFor();
  return project.id;
}

export async function auditPresetPersistence({fresh, out}) {
  return fresh(
    {
      name: 'preset-persistence',
      layout: 'inspector',
      viewport: {width: 1440, height: 1000},
    },
    async tools => {
      const {page, context, doctor} = tools;
      await doctor('/', 'editor', undefined, page);
      const preset = await createPreset(tools);
      const guest = await checkApplied({
        ...tools,
        preset,
        out,
        name: 'preset-guest',
      });
      const projectId = await createSnippet(page, context);
      const snippet = await checkApplied({
        ...tools,
        preset,
        out,
        name: 'preset-snippet',
        projectId,
      });
      return {guest, snippet};
    },
  );
}
