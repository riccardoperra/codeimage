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

// A stand-in for Chrome's Prompt API. The model starts as downloadable, so
// the first session reports download progress, and it answers each known
// request with its plan. It records what the page sends it.
function installLanguageModel({request, plan, failingRequest, failingPlan}) {
  const record = {sessions: [], prompts: []};
  window.__localAi = record;
  let downloaded = false;
  globalThis.LanguageModel = {
    availability: async () => (downloaded ? 'available' : 'downloadable'),
    create: async options => {
      record.sessions.push({system: options.initialPrompts?.[0]?.content});
      if (!downloaded) {
        const monitor = new EventTarget();
        options.monitor?.(monitor);
        for (const loaded of [0, 0.4, 1]) {
          const event = new Event('downloadprogress');
          event.loaded = loaded;
          monitor.dispatchEvent(event);
          await new Promise(done => setTimeout(done, 300));
        }
        downloaded = true;
      }
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

export async function verifyLocalAi({fresh, out}) {
  return fresh(
    {
      name: 'local-ai',
      layout: 'inspector',
      viewport: {width: 1440, height: 1000},
      initialize: context =>
        context.addInitScript(installLanguageModel, {
          request: REQUEST,
          plan: PLAN,
          failingRequest: FAILING_REQUEST,
          failingPlan: FAILING_PLAN,
        }),
    },
    async ({page, doctor, editor, section, settings, closeSettings}) => {
      await doctor();
      const menu = page.locator('[data-command-menu]');
      const commandFor = async label => {
        await page.keyboard.press('ControlOrMeta+k');
        await menu.waitFor();
        await menu.getByRole('combobox').fill(label);
        return menu.getByRole('option', {name: 'Ask local AI…', exact: true});
      };
      assert.equal(
        await (await commandFor('Ask local AI')).count(),
        0,
        'the command waits for the experiment',
      );
      await page.keyboard.press('Escape');
      await menu.waitFor({state: 'detached'});

      await settings('experiments');
      const toggle = page.locator('#settings-local-ai');
      await toggle.focus();
      await page.keyboard.press('Space');
      assert.equal(await toggle.getAttribute('aria-checked'), 'true');
      await closeSettings();

      const framePadding = () =>
        page
          .locator('[data-fit-scale] [data-watermark-frame]')
          .first()
          .evaluate(element => getComputedStyle(element).paddingLeft);
      const paddingBefore = await framePadding();

      await (await commandFor('Ask local AI')).click();
      const dialog = page.locator('[data-local-ai]');
      await dialog.waitFor();
      const request = dialog.getByRole('textbox', {name: 'Request'});
      await request.click();
      await request.pressSequentially(REQUEST);
      assert.equal(await request.inputValue(), REQUEST, 'typed as is');

      const [download] = await Promise.all([
        page.waitForEvent('download', {timeout: 60000}),
        (async () => {
          await dialog.getByRole('button', {name: 'Run', exact: true}).click();
          await dialog.locator('progress').waitFor({timeout: 5000});
          assert.match(
            await dialog.getByRole('status').innerText(),
            /Downloading the on-device model/,
          );
        })(),
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
      await (await commandFor('Ask local AI')).click();
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
