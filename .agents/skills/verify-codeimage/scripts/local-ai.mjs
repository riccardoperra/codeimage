import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {PNG} from 'pngjs';

const CODE = 'def hello():\n    print("hi")';
const REQUEST = `add a tab with this code \`\`\`py\n${CODE}\n\`\`\` named hello.py, use Dracula, padding 32, export PNG 2x`;
const PLAN = {
  steps: [
    {
      tool: 'add_tab',
      args: {code: 'CODE_1', language: 'python', name: 'hello.py'},
    },
    {tool: 'apply_theme', args: {theme: 'Dracula'}},
    {tool: 'set_controls', args: {values: {'frame.padding': 32}}},
    {tool: 'export_image', args: {format: 'png', scale: 2}},
  ],
};
const FAILING_REQUEST = 'use the Nope theme and export';
const FAILING_PLAN = {
  steps: [
    {tool: 'apply_theme', args: {theme: 'Nope'}},
    {tool: 'export_image', args: {}},
  ],
};

// A stand-in for Chrome's Prompt API. In `click` mode the model starts
// downloadable and a create() downloads it with progress 0, then 0.5. In
// `background` mode Chrome is already downloading at load and the model is
// available 8 s later with no progress events. In `fail` mode create() fails.
// `window.__localAi.forced` overrides what availability() answers.
function installLanguageModel({
  mode,
  request,
  plan,
  failingRequest,
  failingPlan,
}) {
  const record = {
    sessions: [],
    prompts: [],
    forced: undefined,
    checks: 0,
    creates: 0,
  };
  window.__localAi = record;
  const started = Date.now();
  let state = mode === 'background' ? 'downloading' : 'downloadable';
  const wait = ms => new Promise(done => setTimeout(done, ms));
  globalThis.LanguageModel = {
    availability: async () => {
      record.checks++;
      if (mode === 'background' && Date.now() - started > 8000)
        state = 'available';
      return record.forced ?? state;
    },
    create: async options => {
      record.creates++;
      if (state !== 'available') {
        if (mode === 'fail') throw new Error('Not enough disk space');
        const monitor = new EventTarget();
        options.monitor?.(monitor);
        for (const loaded of [0, 0.5]) {
          const event = new Event('downloadprogress');
          event.loaded = loaded;
          monitor.dispatchEvent(event);
          await wait(1500);
        }
        state = 'available';
        return {destroy() {}, prompt: async () => ''};
      }
      record.sessions.push({system: options.initialPrompts?.[0]?.content});
      return {
        destroy() {},
        prompt: async (text, {responseConstraint}) => {
          record.prompts.push({text, responseConstraint});
          if (text.startsWith(request.split('```')[0]))
            return JSON.stringify(plan);
          if (text.startsWith(failingRequest))
            return JSON.stringify(failingPlan);
          return '{"steps":[]}';
        },
      };
    },
  };
}

const install = mode => context =>
  context.addInitScript(installLanguageModel, {
    mode,
    request: REQUEST,
    plan: PLAN,
    failingRequest: FAILING_REQUEST,
    failingPlan: FAILING_PLAN,
  });

const modelRow = page => page.locator('[data-setting="local-ai-model"]');
const modelGroup = page =>
  page.locator('section', {has: page.locator('[data-setting="local-ai"]')});

async function commandFor(page) {
  const menu = page.locator('[data-command-menu]');
  await page.keyboard.press('ControlOrMeta+k');
  await menu.waitFor();
  await menu.getByRole('combobox').fill('Ask local AI');
  return menu.getByRole('option', {name: 'Ask local AI…', exact: true});
}

async function closeMenu(page) {
  await page.keyboard.press('Escape');
  await page.locator('[data-command-menu]').waitFor({state: 'detached'});
}

async function turnOn(page) {
  const toggle = page.locator('#settings-local-ai');
  await toggle.focus();
  await page.keyboard.press('Space');
  assert.equal(await toggle.getAttribute('aria-checked'), 'true');
}

export async function verifyLocalAi({fresh, out}) {
  const states = await verifyDownload({fresh, out});
  const background = await verifyBackgroundDownload({fresh});
  const failed = await verifyFailedDownload({fresh, out});
  return {...states, background, failed};
}

// Settings → Experiments downloads the model, then the plan runs.
function verifyDownload({fresh, out}) {
  return fresh(
    {
      name: 'local-ai',
      layout: 'inspector',
      viewport: {width: 1440, height: 1000},
      initialize: install('click'),
    },
    async ({page, doctor, editor, section, settings, closeSettings}) => {
      await doctor();
      assert.equal(
        await (await commandFor(page)).count(),
        0,
        'the command waits for the experiment',
      );
      await closeMenu(page);

      await settings('experiments');
      const row = modelRow(page);
      const group = modelGroup(page);
      await row.getByText('Chrome downloads it once').waitFor();
      await group.screenshot({
        path: resolve(out, 'local-ai-row-downloadable.png'),
      });
      assert.equal(
        await page.evaluate(() => window.__localAi.creates),
        0,
        'nothing downloads before the click',
      );
      await row.getByRole('button', {name: 'Download model'}).click();
      await row.locator('progress:not([value])').waitFor({timeout: 1000});
      assert.match(await row.innerText(), /Starting download…/);
      await group.screenshot({
        path: resolve(out, 'local-ai-row-downloading-indeterminate.png'),
      });
      const determinate = row.locator('progress[value]');
      await determinate.waitFor({timeout: 3000});
      assert.equal(
        await determinate.evaluate(element => element.value),
        0.5,
        'the bar shows real progress once Chrome reports it',
      );
      assert.match(await row.innerText(), /50%/);
      await group.screenshot({
        path: resolve(out, 'local-ai-row-downloading.png'),
      });
      await row.getByText('Ready on this device.').waitFor({timeout: 5000});
      assert.equal(await row.locator('progress, button').count(), 0);
      await group.screenshot({path: resolve(out, 'local-ai-row-ready.png')});

      await turnOn(page);
      await closeSettings();

      const framePadding = () =>
        page
          .locator('[data-fit-scale] [data-watermark-frame]')
          .first()
          .evaluate(element => getComputedStyle(element).paddingLeft);
      const paddingBefore = await framePadding();

      await (await commandFor(page)).click();
      const dialog = page.locator('[data-local-ai]');
      await dialog.waitFor();
      const request = dialog.getByRole('textbox', {name: 'Request'});
      await request.click();
      await request.pressSequentially(REQUEST);
      assert.equal(await request.inputValue(), REQUEST, 'typed as is');

      const [download] = await Promise.all([
        page.waitForEvent('download', {timeout: 60000}),
        dialog.getByRole('button', {name: 'Run', exact: true}).click(),
      ]);
      const file = resolve(out, 'local-ai-2x.png');
      await download.saveAs(file);
      const png = PNG.sync.read(await readFile(file));

      const rows = dialog.getByRole('listitem');
      await page.waitForFunction(
        () => document.querySelectorAll('[data-local-ai] li').length === 4,
      );
      assert.deepEqual(
        await rows.evaluateAll(items =>
          items.map(item => [
            item.querySelector('code').textContent,
            item.dataset.ok,
          ]),
        ),
        [
          ['add_tab', 'true'],
          ['apply_theme', 'true'],
          ['set_controls', 'true'],
          ['export_image', 'true'],
        ],
      );

      const sent = await page.evaluate(() => window.__localAi);
      assert.equal(sent.prompts.length, 1);
      assert.ok(!sent.prompts[0].text.includes('print("hi")'), 'no code sent');
      assert.match(sent.prompts[0].text, /CODE_1/);
      assert.match(sent.prompts[0].text, /CODE_1 was fenced as "py"/);
      const tools =
        sent.prompts[0].responseConstraint.properties.steps.items.properties
          .tool.enum;
      assert.ok(tools.includes('add_tab') && tools.includes('select_tab'));
      assert.ok(!tools.includes('get_editor_state'));
      const system = sent.sessions[0].system;
      assert.match(system, /Dracula/);
      assert.match(system, /frame\.padding: 0\|16\|32\|64\|128 \(now 64\)/);
      assert.ok(
        system.length < 12000,
        `system prompt is ${system.length} chars`,
      );

      await page.keyboard.press('Escape');
      await dialog.waitFor({state: 'detached'});
      assert.equal(await editor().innerText(), CODE, 'the new tab is active');
      assert.ok(
        await page.locator('[data-fit-scale]').getByText('hello.py').count(),
        'the window shows the new tab',
      );
      await section('themes');
      assert.equal(
        await page
          .getByRole('option', {name: 'Dracula Dark theme', exact: true})
          .getAttribute('aria-selected'),
        'true',
      );
      assert.notEqual(await framePadding(), paddingBefore);
      const frame = await page
        .locator('[data-fit-scale] [data-watermark-frame]')
        .first()
        .evaluate(element => [element.offsetWidth, element.offsetHeight]);
      assert.ok(
        Math.abs(png.width - frame[0] * 2) <= 2 &&
          Math.abs(png.height - frame[1] * 2) <= 2,
        `PNG ${png.width}x${png.height} is the ${frame.join('x')} frame at 2x`,
      );

      let downloads = 0;
      page.on('download', () => downloads++);
      await (await commandFor(page)).click();
      await dialog.waitFor();
      const again = dialog.getByRole('textbox', {name: 'Request'});
      await again.fill('');
      await again.pressSequentially(FAILING_REQUEST);
      await dialog.getByRole('button', {name: 'Run', exact: true}).click();
      await dialog.locator('li[data-ok=false]').waitFor();
      assert.equal(await rows.count(), 1, 'the plan stops at the failed step');
      assert.match(await rows.first().innerText(), /Unknown theme "Nope"/);
      await page.waitForTimeout(500);
      assert.equal(downloads, 0, 'nothing after the failed step runs');
      await page.screenshot({path: resolve(out, 'local-ai-dialog.png')});

      return {
        png: [png.width, png.height],
        frame,
        systemPromptChars: system.length,
        requestChars: sent.prompts[0].text.length,
      };
    },
  );
}

// Chrome was already downloading when the page loaded and sends no progress:
// the row polls availability until the model is ready.
function verifyBackgroundDownload({fresh}) {
  return fresh(
    {
      name: 'local-ai-background',
      layout: 'inspector',
      viewport: {width: 1440, height: 1000},
      initialize: install('background'),
    },
    async ({page, doctor, settings, closeSettings}) => {
      const loaded = Date.now();
      await doctor();
      await settings('experiments');
      const row = modelRow(page);
      await row.locator('progress:not([value])').waitFor();
      await turnOn(page);
      await closeSettings();
      assert.equal(
        await (await commandFor(page)).count(),
        0,
        'no command while the model downloads',
      );
      await closeMenu(page);

      await settings('experiments');
      await row.locator('progress:not([value])').waitFor();
      const checks = await page.evaluate(() => window.__localAi.checks);
      await row.getByText('Ready on this device.').waitFor({timeout: 15000});
      const readyAfter = Date.now() - loaded;
      assert.ok(
        (await page.evaluate(() => window.__localAi.checks)) > checks,
        'a poll, not the visit, found the model ready',
      );
      await closeSettings();
      assert.equal(
        await (await commandFor(page)).count(),
        1,
        'the command shows once the model is ready',
      );
      await closeMenu(page);
      await (await commandFor(page)).click();
      const dialog = page.locator('[data-local-ai]');
      await dialog.waitFor();
      await page.evaluate(() => (window.__localAi.forced = 'downloadable'));
      await dialog.getByRole('textbox', {name: 'Request'}).fill('use Dracula');
      await dialog.getByRole('button', {name: 'Run', exact: true}).click();
      await dialog.getByText('The on-device model is not ready.').waitFor();
      await dialog.getByRole('button', {name: 'Open experiments'}).click();
      await dialog.waitFor({state: 'detached'});
      await row.getByRole('button', {name: 'Download model'}).waitFor();
      assert.equal(
        await page.evaluate(() => window.__localAi.creates),
        0,
        'loading, opening the dialog and Run never start a download',
      );
      return {readyAfterMs: readyAfter};
    },
  );
}

// A failed download keeps its message and Retry. When Chrome then says the
// model cannot run here, reopening Experiments says so.
function verifyFailedDownload({fresh, out}) {
  return fresh(
    {
      name: 'local-ai-failed',
      layout: 'inspector',
      viewport: {width: 1440, height: 1000},
      initialize: install('fail'),
    },
    async ({page, doctor, settings, closeSettings}) => {
      await doctor();
      await settings('experiments');
      const row = modelRow(page);
      await row.getByRole('button', {name: 'Download model'}).click();
      await row
        .getByText('The download failed (Not enough disk space).')
        .waitFor();
      await row.getByRole('button', {name: 'Retry'}).waitFor();
      await modelGroup(page).screenshot({
        path: resolve(out, 'local-ai-row-failed.png'),
      });

      await closeSettings();
      await page.evaluate(() => (window.__localAi.forced = 'unavailable'));
      await settings('experiments');
      await row.getByText('This device or Chrome version cannot run').waitFor();
      assert.equal(await row.locator('button, progress').count(), 0);
      await modelGroup(page).screenshot({
        path: resolve(out, 'local-ai-row-unavailable.png'),
      });
      return 'failed, then unavailable';
    },
  );
}
