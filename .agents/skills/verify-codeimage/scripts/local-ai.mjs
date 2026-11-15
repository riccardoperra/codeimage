import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {PNG} from 'pngjs';

const CODE = 'export const answer = 42;\nconsole.log(answer);';
const REQUEST = `add a tab test.tsx with this code ${CODE}, use Dracula, padding 32, export PNG 2x`;
const FAILING_REQUEST = 'use the Nope theme';
const LOOP_REQUEST = 'keep looking at the themes';

// What the fake model answers, by request. Each turn is the chunks
// promptStreaming() yields: text, then tool calls. Text comes as the text so
// far, as Chrome may send it.
// Gemma reuses "call_0" every turn and may send an empty callId, so the
// script does both.
const SCRIPTS = {
  [REQUEST]: [
    [
      {type: 'text', value: 'I will add'},
      {type: 'text', value: 'I will add the tab, then style and export it.'},
      {
        type: 'tool-call',
        value: {
          callId: 'call_0',
          name: 'add_tab',
          arguments: {name: 'test.tsx', language: 'typescript', code: CODE},
        },
      },
      {
        type: 'tool-call',
        value: {
          callId: '',
          name: 'apply_theme',
          arguments: {theme: 'Dracula'},
        },
      },
    ],
    [
      {
        type: 'tool-call',
        value: {
          callId: 'call_0',
          name: 'read_tab',
          arguments: {name: 'nope.ts'},
        },
      },
      {
        type: 'tool-call',
        value: {
          callId: 'call_1',
          name: 'set_controls',
          arguments: {frame_padding: 32},
        },
      },
      {
        type: 'tool-call',
        value: {
          callId: '',
          name: 'export_image',
          arguments: {format: 'png', scale: 2},
        },
      },
    ],
    ['Added test.tsx with Dracula, padding 32, and exported a 2x PNG.'],
  ],
  [FAILING_REQUEST]: [
    [
      {
        type: 'tool-call',
        value: {
          callId: 'bad-1',
          name: 'apply_theme',
          arguments: {theme: 'Nope'},
        },
      },
    ],
    [{type: 'text', value: 'There is no theme called Nope.'}],
  ],
  [LOOP_REQUEST]: Array.from({length: 10}, (_, index) => [
    {
      type: 'tool-call',
      value: {callId: '', name: 'list_themes', arguments: {}},
    },
  ]),
};

// A stand-in for Chrome's Prompt API with tool calling. In `click` mode the
// model starts downloadable and a create() downloads it with progress 0, then
// 0.5. In `background` mode Chrome is already downloading at load and the
// model is available 8 s later with no progress events. In `fail` mode
// create() fails. In `ready` mode the model is available from the start.
// `window.__localAi.forced` overrides what availability() answers, and
// `thinkMs`, `chunkMs` pace the stream.
function installLanguageModel({mode, scripts}) {
  const record = {
    forced: undefined,
    createError: undefined,
    thinkMs: 0,
    chunkMs: 150,
    checks: 0,
    creates: 0,
    bases: [],
    clones: 0,
    appended: [],
    prompts: [],
    asked: [],
  };
  window.__localAi = record;
  const started = Date.now();
  let state =
    mode === 'background'
      ? 'downloading'
      : mode === 'ready'
        ? 'available'
        : 'downloadable';
  const wait = ms => new Promise(done => setTimeout(done, ms));
  const wrapper = kind =>
    class {
      constructor(init) {
        Object.assign(this, init, {kind});
      }
    };
  globalThis.LanguageModelToolCall = wrapper('call');
  globalThis.LanguageModelToolSuccess = wrapper('success');
  globalThis.LanguageModelToolError = wrapper('error');
  const plain = value => JSON.parse(JSON.stringify(value));

  function session() {
    let script;
    let turn = 0;
    return {
      destroy() {},
      async append(messages) {
        record.appended.push(plain(messages));
      },
      async clone() {
        record.clones++;
        return session();
      },
      promptStreaming(input) {
        record.prompts.push(plain(input));
        if (typeof input === 'string') {
          script = scripts[input] ?? [['I cannot help with that.']];
          turn = 0;
        }
        const chunks = script[turn++] ?? ['Nothing more to do.'];
        return new ReadableStream({
          async start(controller) {
            await wait(record.thinkMs);
            for (const chunk of chunks) {
              controller.enqueue(chunk);
              await wait(record.chunkMs);
            }
            controller.close();
          },
        });
      },
    };
  }

  globalThis.LanguageModel = {
    availability: async options => {
      record.checks++;
      if (options?.tools) record.asked.push(plain(options));
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
        return session();
      }
      if (options.tools && record.createError)
        throw new DOMException(
          'The device is unable to create a session to run the model.',
          record.createError,
        );
      if (options.tools)
        record.bases.push(
          plain({
            initialPrompts: options.initialPrompts,
            tools: options.tools.map(tool => tool.name),
            toolSpecs: options.tools,
            expectedInputs: options.expectedInputs,
            expectedOutputs: options.expectedOutputs,
            availability: record.asked.at(-1),
          }),
        );
      return session();
    },
  };
}

const install = mode => context =>
  context.addInitScript(installLanguageModel, {mode, scripts: SCRIPTS});

const modelRow = page => page.locator('[data-setting="local-ai-model"]');
const requirements = row => row.getByRole('list', {name: 'What Chrome needs'});
const statusOf = (row, id) =>
  row.locator(`[data-requirement="${id}"]`).getAttribute('data-status');

// A device whose page-readable facts are fixed: 8 cores, 4 GB of RAM.
function fixDevice() {
  Object.defineProperty(Navigator.prototype, 'hardwareConcurrency', {
    get: () => 8,
  });
  Object.defineProperty(Navigator.prototype, 'deviceMemory', {get: () => 4});
}
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

// The experiment already on, as a returning user has it.
function experimentOn() {
  const key = 'codeimage:editor-settings';
  const stored = JSON.parse(localStorage.getItem(key) ?? '{}');
  localStorage.setItem(key, JSON.stringify({...stored, localAi: true}));
}

const bar = page => page.locator('[data-local-ai]');
const field = page => bar(page).getByRole('textbox', {name: 'Request'});
const run = page => bar(page).locator('[data-local-ai-run]');
const rows = page => run(page).locator('li[data-tool]');

// Every distinct state of the run, recorded in the page so that no state is
// missed between two polls.
async function recordRuns(page) {
  await page.evaluate(() => {
    window.__runs = [];
    const take = () => {
      const panel = document.querySelector('[data-local-ai-run]');
      if (!panel) return;
      const snap = {
        phase: panel.dataset.localAiRun,
        thinking: !!panel.querySelector('[data-local-ai-thinking]'),
        calls: [...panel.querySelectorAll('li[data-tool]')].map(
          li => `${li.dataset.tool}:${li.dataset.status}`,
        ),
      };
      if (JSON.stringify(window.__runs.at(-1)) !== JSON.stringify(snap))
        window.__runs.push(snap);
    };
    new MutationObserver(take).observe(document.body, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ['data-status', 'data-local-ai-run'],
    });
  });
}

async function send(page, request) {
  await field(page).fill(request);
  await page.keyboard.press('Enter');
}

export async function verifyLocalAi({fresh, out}) {
  const states = await verifyDownload({fresh, out});
  const background = await verifyBackgroundDownload({fresh});
  const failed = await verifyFailedDownload({fresh, out});
  const layouts = {};
  for (const target of LAYOUTS)
    layouts[target.name] = await verifyLayout({fresh, out, ...target});
  for (const layout of ['inspector', 'dock', 'studio'])
    layouts[`${layout}-phone`] = await verifyNoPhone({fresh, layout});
  return {...states, background, failed, layouts};
}

const LAYOUTS = [
  {name: 'inspector', layout: 'inspector'},
  {name: 'dock', layout: 'dock'},
  {name: 'studio', layout: 'studio'},
];

async function dismissNudge(page) {
  const nudge = page.locator('[data-whats-new=nudge]');
  await nudge.waitFor({timeout: 8000}).catch(() => {});
  await nudge
    .getByRole('button', {name: "Dismiss what's new"})
    .click()
    .catch(() => {});
  await nudge.waitFor({state: 'hidden'});
}

// The bar in each desktop layout: it opens in the action bar's place without
// moving the frame, and shows thinking, a call running and the answer.
function verifyLayout({fresh, out, name, layout}) {
  const width = 1440;
  return fresh(
    {
      name: `local-ai-${name}`,
      layout,
      viewport: {width, height: 1000},
      initialize: async context => {
        await install('ready')(context);
        await context.addInitScript(experimentOn);
      },
    },
    async ({page, doctor}) => {
      await doctor();
      await dismissNudge(page);
      const shot = state =>
        page.screenshot({path: resolve(out, `local-ai-${name}-${state}.png`)});
      const frameBox = () =>
        page
          .locator('[data-fit-scale] [data-watermark-frame]')
          .first()
          .boundingBox();
      const before = await frameBox();
      await page.locator('[data-ask-ai]').click();
      await field(page).waitFor();
      await page.waitForTimeout(300);
      const after = await frameBox();
      assert.ok(
        Object.keys(before).every(
          key => Math.abs(after[key] - before[key]) < 0.5,
        ),
        `the frame stays where it was: ${JSON.stringify([before, after])}`,
      );
      const box = await bar(page).locator('[data-local-ai-bar]').boundingBox();
      assert.ok(
        box.width > 300 && box.x >= 8 && box.x + box.width <= width - 8,
        `the bar keeps off the edges: ${box.x} to ${box.x + box.width} of ${width}`,
      );
      assert.ok(
        await page.evaluate(
          () => document.scrollingElement.scrollWidth <= innerWidth,
        ),
        'no horizontal scroll',
      );
      await shot('idle');

      await page.evaluate(() => {
        window.__localAi.thinkMs = 1500;
        window.__localAi.chunkMs = 700;
      });
      await send(page, REQUEST);
      await bar(page).locator('[data-local-ai-thinking]').waitFor();
      await shot('thinking');
      await rows(page).nth(1).waitFor();
      await shot('running');
      await bar(page)
        .locator('[data-local-ai-run="answered"]')
        .waitFor({timeout: 60000});
      const panel = await run(page).boundingBox();
      assert.ok(
        panel.y >= 0 && panel.y + panel.height <= box.y + 1,
        'the list sits above the bar, on screen',
      );
      await shot('done');
      await field(page).focus();
      await page.keyboard.press('Escape');
      await bar(page).waitFor({state: 'detached'});
      return {bar: [Math.round(box.width), Math.round(box.height)]};
    },
  );
}

// No Ask AI on a phone: neither the button nor the command.
function verifyNoPhone({fresh, layout}) {
  return fresh(
    {
      name: `local-ai-${layout}-phone`,
      layout,
      viewport: {width: 390, height: 844},
      initialize: async context => {
        await install('ready')(context);
        await context.addInitScript(experimentOn);
      },
    },
    async ({page, doctor}) => {
      await doctor();
      await dismissNudge(page);
      await page.waitForTimeout(500);
      assert.equal(
        await page.locator('[data-ask-ai]').count(),
        0,
        `no Ask AI button in ${layout} at 390 px`,
      );
      const option = await commandFor(page);
      await page.waitForTimeout(200);
      assert.equal(await option.count(), 0, 'no Ask AI command at 390 px');
      await closeMenu(page);
      assert.equal(await bar(page).count(), 0);
      return 'absent';
    },
  );
}

// Settings → Experiments downloads the model, then a request runs through
// native tool calls.
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
      assert.equal(await page.locator('[data-ask-ai]').count(), 0);

      await settings('experiments');
      const row = modelRow(page);
      const group = modelGroup(page);
      await row.getByText('Chrome downloads it once').waitFor();
      await requirements(row).waitFor();
      assert.equal(
        await requirements(row).getByRole('listitem').count(),
        6,
        'every requirement is listed while the model is downloadable',
      );
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
      assert.match(
        await row.innerText(),
        /Downloading… Chrome doesn't report progress yet\./,
      );
      assert.equal(
        await requirements(row).count(),
        0,
        'no list once downloading',
      );
      assert.deepEqual(
        await row
          .locator('[data-address]')
          .evaluateAll(chips => chips.map(chip => chip.dataset.address)),
        ['chrome://on-device-internals'],
        'only the internals page, for the live download status',
      );
      assert.equal(
        await row.getByRole('button', {name: 'Restart download'}).count(),
        0,
        'no restart while this page downloads',
      );
      await group.screenshot({
        path: resolve(out, 'local-ai-row-downloading-indeterminate.png'),
      });
      const determinate = row.locator('progress[value]');
      await determinate.waitFor({timeout: 3000});
      assert.equal(await determinate.evaluate(element => element.value), 0.5);
      assert.match(await row.innerText(), /50%/);
      assert.equal(await row.locator('[data-address]').count(), 0);
      await group.screenshot({
        path: resolve(out, 'local-ai-row-downloading.png'),
      });
      await row.getByText('Ready on this device.').waitFor({timeout: 5000});
      assert.equal(await row.locator('progress, button').count(), 0);
      await group.screenshot({path: resolve(out, 'local-ai-row-ready.png')});

      await turnOn(page);
      await closeSettings();
      await dismissNudge(page);

      const framePadding = () =>
        page
          .locator('[data-fit-scale] [data-watermark-frame]')
          .first()
          .evaluate(element => getComputedStyle(element).paddingLeft);
      const paddingBefore = await framePadding();

      const ask = page.locator('[data-ask-ai]');
      await ask.click();
      await field(page).waitFor();
      assert.equal(
        await field(page).evaluate(
          element => element === document.activeElement,
        ),
        true,
        'the field takes the focus',
      );
      assert.equal(
        await ask.isVisible(),
        false,
        'the bar covers the toolbar, which keeps its place hidden',
      );
      await field(page).pressSequentially('one');
      await page.keyboard.press('Shift+Enter');
      await field(page).pressSequentially('two');
      assert.equal(
        await field(page).inputValue(),
        'one\ntwo',
        'Shift+Enter breaks the line',
      );
      await page.keyboard.press('ControlOrMeta+a');
      await page.keyboard.press('Backspace');
      assert.equal(
        await field(page).inputValue(),
        '',
        'the field keeps its keys',
      );

      await recordRuns(page);
      await page.evaluate(() => (window.__localAi.thinkMs = 600));
      const [download] = await Promise.all([
        page.waitForEvent('download', {timeout: 60000}),
        send(page, REQUEST),
      ]);
      const file = resolve(out, 'local-ai-2x.png');
      await download.saveAs(file);
      const png = PNG.sync.read(await readFile(file));
      await bar(page)
        .locator('[data-local-ai-run="answered"]')
        .waitFor({timeout: 15000});
      assert.equal(
        await field(page).inputValue(),
        '',
        'Enter sent the request',
      );

      const runs = await page.evaluate(() => window.__runs);
      assert.equal(runs[0].phase, 'thinking', 'the run starts by thinking');
      assert.ok(runs[0].thinking, 'thinking shows');
      for (const tool of [
        'add_tab',
        'apply_theme',
        'set_controls',
        'export_image',
      ]) {
        const running = runs.findIndex(state =>
          state.calls.includes(`${tool}:running`),
        );
        const done = runs.findIndex(state =>
          state.calls.includes(`${tool}:done`),
        );
        assert.ok(
          running >= 0 && done > running,
          `${tool} shows running, then done`,
        );
      }
      const listed = await rows(page).evaluateAll(items =>
        items.map(item => [
          item.dataset.tool,
          item.dataset.status,
          item.querySelector('[data-tool-name]').textContent,
          item.querySelector('[data-summary]')?.textContent,
          item.hasAttribute('data-read-only'),
        ]),
      );
      const [seedRow] = listed;
      assert.deepEqual(
        seedRow.slice(0, 3).concat(seedRow[4]),
        ['get_editor_state', 'done', 'get_editor_state', true],
        'the first row is the editor state the model received, drawn read-only',
      );
      assert.match(
        seedRow[3],
        /^1 tab · .+ · .+$/,
        'the seed row sums up the tabs, the active tab and the theme',
      );
      assert.match(await rows(page).first().innerText(), /Read the editor/);
      assert.deepEqual(
        listed.slice(1).map(row => row.slice(0, 4)),
        [
          ['add_tab', 'done', 'add_tab', 'test.tsx · typescript · 2 lines'],
          ['apply_theme', 'done', 'apply_theme', 'Dracula'],
          ['read_tab', 'failed', 'read_tab', 'nope.ts'],
          ['set_controls', 'done', 'set_controls', 'padding 32'],
          ['export_image', 'done', 'export_image', 'PNG · 2x · download'],
        ],
        'each call keeps its own row, status and arguments though call ids repeat',
      );
      assert.match(
        await rows(page).nth(3).innerText(),
        /No tab named "nope\.ts"/,
        'the failed read shows its own error',
      );
      assert.match(await rows(page).nth(1).innerText(), /Add a tab/);
      assert.equal(
        await run(page).locator('[data-local-ai-note]').innerText(),
        'I will add the tab, then style and export it.',
        'cumulative text chunks read once',
      );
      assert.equal(
        await run(page).locator('[data-local-ai-answer]').innerText(),
        'Added test.tsx with Dracula, padding 32, and exported a 2x PNG.',
      );
      assert.equal(
        await page.locator('[data-tool-activity]').count(),
        0,
        'the activity card leaves local AI to the bar',
      );
      await page.screenshot({path: resolve(out, 'local-ai-answered.png')});

      const sent = await page.evaluate(() => window.__localAi);
      assert.equal(sent.bases.length, 1);
      const base = sent.bases[0];
      assert.equal(base.initialPrompts[0].role, 'system');
      assert.equal(
        base.initialPrompts.length,
        1,
        'the system prompt alone: no worked examples for the model to copy',
      );
      assert.deepEqual(
        base.availability,
        {
          tools: base.toolSpecs,
          expectedInputs: base.expectedInputs,
          expectedOutputs: base.expectedOutputs,
        },
        'availability() asks with the options create() gets',
      );
      assert.ok(
        !/index\.tsx|Fleet Dark|frame_padding": /.test(
          base.initialPrompts[0].content,
        ),
        'no editor state in the system prompt',
      );
      assert.deepEqual(
        [...base.tools].sort(),
        [
          'add_tab',
          'apply_theme',
          'duplicate_tab',
          'export_image',
          'get_editor_state',
          'list_themes',
          'read_tab',
          'select_tab',
          'set_animate_mode',
          'set_code',
          'set_controls',
        ],
        'the eleven agent tools',
      );
      assert.deepEqual(
        base.expectedOutputs.map(output => output.type),
        ['text', 'tool-call'],
      );
      const [seed] = sent.appended;
      assert.equal(seed[0].role, 'assistant');
      assert.equal(seed[0].content[0].value.kind, 'call');
      assert.equal(seed[0].content[0].value.name, 'get_editor_state');
      assert.equal(seed[1].content[0].value.kind, 'success');
      assert.equal(
        seed[1].content[0].value.callId,
        seed[0].content[0].value.callId,
        'the seeded state answers its own call',
      );
      const state = seed[1].content[0].value.result[0].value;
      assert.ok(Array.isArray(state.tabs), 'the seed is the real editor state');
      assert.ok(
        Object.keys(state.settings).length > 10 &&
          Object.keys(state.settings).every(name => !name.includes('.')),
        'the seed names every setting without dots',
      );
      assert.ok(state.themes.includes('Dracula'), 'the seed lists theme names');
      assert.ok(
        !JSON.stringify(state.tabs).includes('test.tsx'),
        'read before the request ran',
      );
      assert.equal(sent.prompts[0], REQUEST);
      assert.deepEqual(
        [sent.prompts[1], sent.prompts[2]].map(prompt =>
          prompt[0].content.map(({value}) => [
            value.kind,
            value.callId,
            value.name,
          ]),
        ),
        [
          [
            ['success', 'call_0', 'add_tab'],
            ['success', '', 'apply_theme'],
          ],
          [
            ['error', 'call_0', 'read_tab'],
            ['success', 'call_1', 'set_controls'],
            ['success', '', 'export_image'],
          ],
        ],
        'the results go back with the callIds as the model sent them',
      );

      assert.equal(await editor().innerText(), CODE, 'the new tab is active');
      assert.ok(
        await page.locator('[data-fit-scale]').getByText('test.tsx').count(),
        'the window shows the new tab',
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

      await send(page, FAILING_REQUEST);
      await bar(page).locator('[data-local-ai-run="answered"]').waitFor();
      assert.deepEqual(
        await rows(page).evaluateAll(items =>
          items.map(item => [item.dataset.tool, item.dataset.status]),
        ),
        [
          ['get_editor_state', 'done'],
          ['apply_theme', 'failed'],
        ],
        'a new request starts a new list',
      );
      assert.match(await rows(page).nth(1).innerText(), /Nope/);
      const error = await page.evaluate(
        () => window.__localAi.prompts.at(-1)[0].content[0].value,
      );
      assert.equal(error.kind, 'error');
      assert.equal(error.callId, 'bad-1');
      assert.match(error.errorMessage, /Nope/, 'the error reaches the model');
      assert.equal(
        await run(page).locator('[data-local-ai-answer]').innerText(),
        'There is no theme called Nope.',
      );
      const after = await page.evaluate(() => window.__localAi);
      assert.equal(after.bases.length, 1, 'one base session for two requests');
      assert.equal(after.clones, 2, 'each request clones it');
      await page.screenshot({path: resolve(out, 'local-ai-failed.png')});

      await page.evaluate(() => (window.__localAi.chunkMs = 0));
      await send(page, LOOP_REQUEST);
      await bar(page)
        .locator('[data-local-ai-run="turn-limit"]')
        .waitFor({timeout: 20000});
      assert.equal(
        await rows(page).count(),
        7,
        'the editor state, then six turns of calls',
      );
      assert.match(await run(page).innerText(), /Stopped after 6 turns/);
      await page.screenshot({path: resolve(out, 'local-ai-turn-limit.png')});

      await field(page).focus();
      await page.keyboard.press('Escape');
      await bar(page).waitFor({state: 'detached'});
      await page.waitForFunction(
        () => document.activeElement?.hasAttribute('data-ask-ai'),
        undefined,
        {timeout: 2000},
      );

      await (await commandFor(page)).click();
      await field(page).waitFor();
      assert.equal(await run(page).count(), 0, 'closing forgot the last run');
      await page.waitForFunction(
        () => document.activeElement?.getAttribute('aria-label') === 'Request',
        undefined,
        {timeout: 2000},
      );
      await page.keyboard.press('Escape');
      await bar(page).waitFor({state: 'detached'});
      await section('themes');
      assert.equal(
        await page
          .getByRole('option', {name: 'Dracula Dark theme', exact: true})
          .getAttribute('aria-selected'),
        'true',
      );

      const fullStateChars = await page.evaluate(async () => {
        let group;
        const event = new Event('devtoolstooldiscovery');
        event.respondWith = value => (group = value);
        window.dispatchEvent(event);
        const read = group.tools.find(tool => tool.name === 'get_editor_state');
        const {ok: _, ...output} = await read.execute({});
        return JSON.stringify(output).length;
      });
      const seedChars = JSON.stringify(state).length;
      assert.ok(
        seedChars * 3 < fullStateChars,
        `the seed (${seedChars}) is a fraction of get_editor_state (${fullStateChars})`,
      );
      return {
        png: [png.width, png.height],
        frame,
        systemPromptChars: base.initialPrompts[0].content.length,
        initialPromptsChars: JSON.stringify(base.initialPrompts).length,
        seedChars,
        fullStateChars,
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
      assert.equal(
        await page.locator('#settings-local-ai').isDisabled(),
        true,
        'the switch waits for the model',
      );
      await row.getByRole('button', {name: 'Restart download'}).waitFor();
      const checks = await page.evaluate(() => window.__localAi.checks);
      await row.getByText('Ready on this device.').waitFor({timeout: 15000});
      const readyAfter = Date.now() - loaded;
      assert.ok(
        (await page.evaluate(() => window.__localAi.checks)) > checks,
        'a poll, not the visit, found the model ready',
      );
      await turnOn(page);
      await closeSettings();
      await (await commandFor(page)).click();
      await field(page).waitFor();
      await page.evaluate(
        () => (window.__localAi.createError = 'InvalidStateError'),
      );
      await send(page, 'use Dracula');
      await bar(page)
        .getByText(
          'Chrome could not start the on-device model. Check free disk space and chrome://on-device-internals.',
        )
        .waitFor();
      assert.equal(
        await run(page).getAttribute('data-local-ai-run'),
        'cannot-start',
      );
      await page.evaluate(() => (window.__localAi.forced = 'downloadable'));
      await send(page, 'use Dracula');
      await bar(page).getByText('The on-device model is not ready.').waitFor();
      await bar(page).getByRole('button', {name: 'Open experiments'}).click();
      await bar(page).waitFor({state: 'detached'});
      await row.getByRole('button', {name: 'Download model'}).waitFor();
      assert.equal(
        await page.evaluate(() => window.__localAi.creates),
        1,
        'only the session that could not start called create(): no download',
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
      initialize: async context => {
        await install('fail')(context);
        await context.addInitScript(fixDevice);
      },
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
      await row
        .getByText('Chrome says it cannot run on this device.')
        .waitFor();
      await requirements(row).waitFor();
      assert.equal(await statusOf(row, 'cpu'), 'met', '8 cores are enough');
      assert.equal(
        await statusOf(row, 'memory'),
        'unknown',
        'a GPU can stand in for 4 GB of RAM',
      );
      assert.equal(await statusOf(row, 'disk'), 'unknown');
      assert.equal(await statusOf(row, 'setting'), 'unknown');
      const internals = row.locator(
        '[data-address="chrome://on-device-internals"]',
      );
      await internals
        .getByRole('button', {name: 'Copy chrome://on-device-internals'})
        .click();
      await internals.getByRole('button', {name: 'Copied'}).waitFor();
      assert.equal(
        await page.evaluate(() => navigator.clipboard.readText()),
        'chrome://on-device-internals',
        'the chip copies the address',
      );
      assert.equal(
        await page.locator('#settings-local-ai').isDisabled(),
        true,
        'the switch is off while the model cannot run',
      );
      await row.getByRole('button', {name: 'Check again'}).click();
      assert.equal(await row.locator('progress').count(), 0);
      await modelGroup(page).screenshot({
        path: resolve(out, 'local-ai-row-unavailable.png'),
      });
      return 'failed, then unavailable';
    },
  );
}
