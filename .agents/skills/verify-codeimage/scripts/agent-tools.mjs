import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {PNG} from 'pngjs';

const TOOLS = [
  'get_editor_state',
  'list_themes',
  'set_code',
  'add_tab',
  'duplicate_tab',
  'select_tab',
  'read_tab',
  'apply_theme',
  'set_controls',
  'set_animate_mode',
  'export_image',
];

// A stand-in for the browser's WebMCP agent: it records what the page
// registers, and drops a tool when its signal aborts, as the draft specifies.
function installModelContext() {
  const tools = new Map();
  window.__webmcpTools = tools;
  const context = {
    registerTool(tool, options = {}) {
      tools.set(tool.name, tool);
      options.signal?.addEventListener('abort', () => tools.delete(tool.name));
      return Promise.resolve();
    },
  };
  Object.defineProperty(Document.prototype, 'modelContext', {
    configurable: true,
    get: () => context,
  });
}

export async function verifyAgentTools({fresh, out}) {
  return fresh(
    {
      name: 'agent-tools',
      layout: 'inspector',
      viewport: {width: 1440, height: 1000},
      initialize: context => context.addInitScript(installModelContext),
    },
    async ({page, doctor, editor, section}) => {
      await doctor();
      await page.waitForFunction(
        count => window.__webmcpTools.size === count,
        TOOLS.length,
      );
      assert.deepEqual(
        await page.evaluate(() => [...window.__webmcpTools.keys()].sort()),
        [...TOOLS].sort(),
        'WebMCP received every tool',
      );
      assert.deepEqual(
        await page.evaluate(() =>
          [...window.__webmcpTools.values()]
            .filter(tool => tool.annotations?.untrustedContentHint)
            .map(tool => tool.name)
            .sort(),
        ),
        ['get_editor_state', 'read_tab'],
        'the tools that return code mark it as untrusted',
      );
      assert.ok(
        await page.evaluate(() =>
          [...window.__webmcpTools.values()].every(
            tool =>
              !JSON.stringify(tool.inputSchema).includes('"values"') &&
              Object.keys(tool.inputSchema.properties ?? {}).every(
                name => !name.includes('.'),
              ),
          ),
        ),
        'no tool takes dotted or wrapped argument names',
      );
      const call = (name, input) =>
        page.evaluate(
          ([name, input]) =>
            window.__webmcpTools
              .get(name)
              .execute(input, {signal: new AbortController().signal}),
          [name, input],
        );
      const state = () => call('get_editor_state', {});

      const initial = await state();
      assert.equal(initial.ok, true);
      assert.equal(initial.editable, true);

      const coded = await call('set_code', {
        code: 'const agent = 42;',
        language: 'Python',
      });
      assert.equal(coded.ok, true);
      assert.equal(coded.language, 'python');
      assert.equal(
        typeof coded.tab.id,
        'string',
        'set_code names the tab it wrote by editor id',
      );
      assert.equal(await editor().innerText(), 'const agent = 42;');
      assert.match(
        await page.locator('#inspector-editor-language-trigger').innerText(),
        /Python/,
      );

      const badLanguage = await call('set_code', {
        code: 'const changed = true;',
        language: 'Klingon',
      });
      assert.equal(badLanguage.ok, false);
      assert.match(badLanguage.error, /Unknown language/);
      assert.equal(
        await editor().innerText(),
        'const agent = 42;',
        'an unknown language writes no code',
      );

      const {themes} = await call('list_themes', {});
      assert.ok(themes.some(theme => theme.name === 'Dracula'));
      assert.deepEqual(await call('apply_theme', {theme: 'dracula'}), {
        ok: true,
        theme: {id: 'dracula', name: 'Dracula'},
      });
      await section('themes');
      assert.equal(
        await page
          .getByRole('option', {name: 'Dracula Dark theme', exact: true})
          .getAttribute('aria-selected'),
        'true',
        'the theme list shows the theme the agent applied',
      );
      const badTheme = await call('apply_theme', {theme: 'Dracul Night'});
      assert.equal(badTheme.ok, false);
      assert.ok(badTheme.suggestions.includes('Dracula'));
      assert.equal((await state()).theme.id, 'dracula');

      const control = (snapshot, name) =>
        snapshot.settings.find(setting => setting.name === name);
      const before = await state();
      const padding = control(before, 'frame_padding');
      const target = padding.options.find(
        option => option.value !== padding.value,
      ).value;
      const framePadding = () =>
        page
          .locator('[data-fit-scale] [data-watermark-frame]')
          .first()
          .evaluate(element => getComputedStyle(element).paddingLeft);
      const paddingBefore = await framePadding();
      assert.deepEqual(await call('set_controls', {frame_padding: target}), {
        ok: true,
        applied: {frame_padding: target},
      });
      assert.equal(control(await state(), 'frame_padding').value, target);
      assert.notEqual(
        await framePadding(),
        paddingBefore,
        'the live frame shows the new padding',
      );

      const opacity = control(await state(), 'frame_opacity').value;
      const outOfRange = await call('set_controls', {
        frame_opacity: 150,
      });
      assert.equal(outOfRange.ok, false);
      assert.deepEqual(outOfRange.applied, {});
      assert.match(outOfRange.errors['frame_opacity'], /from 0 to 100/);
      assert.equal(control(await state(), 'frame_opacity').value, opacity);

      const exported = async (scale, name) => {
        const [download, result] = await Promise.all([
          page.waitForEvent('download', {timeout: 60000}),
          call('export_image', {format: 'png', scale, delivery: 'download'}),
        ]);
        assert.deepEqual(result, {
          ok: true,
          status: 'done',
          format: 'png',
          scale,
          delivery: 'download',
        });
        const file = resolve(out, name);
        await download.saveAs(file);
        return PNG.sync.read(await readFile(file));
      };
      const one = await exported(1, 'agent-1x.png');
      const two = await exported(2, 'agent-2x.png');
      assert.ok(
        Math.abs(two.width - one.width * 2) <= 1 &&
          Math.abs(two.height - one.height * 2) <= 1,
        `2x export is twice 1x: ${one.width}x${one.height} -> ${two.width}x${two.height}`,
      );
      const badExport = await call('export_image', {scale: 5});
      assert.equal(badExport.ok, false);

      const devtools = await page.evaluate(async () => {
        let group;
        const event = new Event('devtoolstooldiscovery');
        event.respondWith = value => (group = value);
        window.dispatchEvent(event);
        const applyTheme = group.tools.find(
          tool => tool.name === 'apply_theme',
        );
        return {
          name: group.name,
          tools: group.tools.map(tool => tool.name),
          schema: applyTheme.inputSchema,
          result: await applyTheme.execute({theme: 'Night Owl'}),
        };
      });
      assert.equal(devtools.name, 'CodeImage');
      assert.deepEqual(devtools.tools, TOOLS);
      assert.deepEqual(devtools.schema.required, ['theme']);
      assert.equal(devtools.result.ok, true, JSON.stringify(devtools.result));
      assert.equal((await state()).theme.id, devtools.result.theme.id);

      const showsCode = async (code, message) => {
        for (let i = 0; i < 40 && (await editor().innerText()) !== code; i++)
          await page.waitForTimeout(50);
        assert.equal(await editor().innerText(), code, message);
      };
      assert.deepEqual(
        (await state()).tabs.map(tab => [tab.index, tab.active]),
        [[0, true]],
      );
      const added = await call('add_tab', {
        code: 'print("tab")',
        language: 'Python',
        name: 'main.py',
      });
      assert.equal(typeof added.tab.id, 'string');
      assert.notEqual(added.tab.id, coded.tab.id);
      assert.deepEqual(
        {...added, tab: {...added.tab, id: undefined}},
        {
          ok: true,
          tab: {
            id: undefined,
            index: 1,
            name: 'main.py',
            language: 'python',
            active: true,
          },
        },
      );
      await showsCode('print("tab")', 'the editor shows the added tab');
      const badTab = await call('add_tab', {language: 'Klingon'});
      assert.equal(badTab.ok, false);
      assert.equal(
        (await state()).tabs.length,
        2,
        'a bad language adds no tab',
      );

      assert.equal((await call('select_tab', {index: 0})).ok, true);
      await showsCode('const agent = 42;', 'select_tab by index');
      assert.equal((await call('select_tab', {name: 'MAIN.PY'})).ok, true);
      await showsCode('print("tab")', 'select_tab by name');
      const missingTab = await call('select_tab', {name: 'nope.rs'});
      assert.equal(missingTab.ok, false);
      assert.match(missingTab.error, /1 "main\.py" \(active\)/);

      assert.equal((await call('select_tab', {index: 0})).ok, true);
      assert.deepEqual(
        await call('read_tab', {name: 'main.py'}),
        {
          ok: true,
          tab: {index: 1, name: 'main.py', language: 'python', active: false},
          code: 'print("tab")',
        },
        "read_tab reads another tab's code",
      );
      await showsCode('const agent = 42;', 'read_tab leaves the active tab');
      assert.deepEqual(
        (await state()).tabs.map(tab => tab.active),
        [true, false],
        'the active tab stays the same',
      );
      assert.deepEqual(
        await call('read_tab', {}),
        {
          ok: true,
          tab: (await state()).tabs[0],
          code: 'const agent = 42;',
        },
        'read_tab without arguments reads the active tab',
      );
      const missingRead = await call('read_tab', {name: 'nope.rs'});
      assert.equal(missingRead.ok, false);
      assert.match(missingRead.error, /No tab named "nope\.rs"/);
      assert.equal((await call('select_tab', {name: 'main.py'})).ok, true);
      const copied = await call('duplicate_tab', {});
      assert.deepEqual(
        {...copied, tab: {...copied.tab, id: undefined}},
        {
          ok: true,
          tab: {
            id: undefined,
            index: 2,
            name: 'main copy.py',
            language: 'python',
            active: true,
          },
        },
        'duplicate_tab copies the active tab and selects the copy',
      );
      await showsCode('print("tab")', 'the copy carries the code');

      let tabCount = (await state()).tabs.length;
      while (tabCount < 6) {
        assert.equal((await call('add_tab', {})).ok, true);
        tabCount = (await state()).tabs.length;
      }
      const full = await call('add_tab', {code: 'one too many'});
      assert.equal(full.ok, false);
      assert.match(full.error, /6 tabs/);
      assert.equal((await state()).tabs.length, 6);

      assert.deepEqual(await call('set_animate_mode', {open: true}), {
        ok: true,
        open: true,
      });
      assert.equal((await state()).animate, true, 'the state reads Animate on');
      assert.deepEqual(await call('set_animate_mode', {open: false}), {
        ok: true,
        open: false,
      });
      assert.equal((await state()).animate, false);

      const activity = await verifyActivity({page, call, out, padding: target});

      return {
        png1x: [one.width, one.height],
        png2x: [two.width, two.height],
        padding: target,
        devtoolsTheme: devtools.result.theme.id,
        tabs: tabCount,
        activity,
      };
    },
  );
}

const CARD = '[data-tool-activity]';
const PROBE = 'activityProbe';

async function rows(page) {
  return page.locator(`${CARD} li`).evaluateAll(items =>
    items.map(item => ({
      tool: item.querySelector('[data-tool-name]')?.textContent,
      status: item.dataset.status,
      summary: item.querySelector('[data-summary]')?.textContent ?? '',
      error: item.querySelector('[data-error]')?.textContent,
      readOnly: item.hasAttribute('data-read-only'),
    })),
  );
}

// The card that shows the person watching what an agent calls.
async function verifyActivity({page, call, out, padding}) {
  const card = page.locator(CARD);
  await card.waitFor({state: 'detached', timeout: 20000});

  const exporting = call('export_image', {
    format: 'png',
    scale: 2,
    delivery: 'download',
  });
  await page
    .locator(`${CARD} li[data-tool="export_image"][data-status="running"]`)
    .waitFor({timeout: 5000});
  const [download] = await Promise.all([
    page.waitForEvent('download', {timeout: 60000}),
    exporting,
  ]);
  await download.cancel().catch(() => {});

  await call('set_code', {
    code: `const ${PROBE} = 1;\nconsole.log(${PROBE});`,
    language: 'TypeScript',
  });
  await call('apply_theme', {theme: 'Dracula'});
  await call('set_controls', {frame_padding: padding});
  const failed = await call('apply_theme', {theme: 'Dracul Night'});
  await call('list_themes', {});

  const listed = await rows(page);
  assert.ok(
    listed.length > 6,
    'calls from before the card hid come back with the next call',
  );
  assert.deepEqual(listed.slice(-6), [
    {
      tool: 'export_image',
      status: 'done',
      summary: 'PNG · 2x · download',
      error: undefined,
      readOnly: false,
    },
    {
      tool: 'set_code',
      status: 'done',
      summary: 'TypeScript · 2 lines',
      error: undefined,
      readOnly: false,
    },
    {
      tool: 'apply_theme',
      status: 'done',
      summary: 'Dracula',
      error: undefined,
      readOnly: false,
    },
    {
      tool: 'set_controls',
      status: 'done',
      summary: `padding ${padding}`,
      error: undefined,
      readOnly: false,
    },
    {
      tool: 'apply_theme',
      status: 'failed',
      summary: 'Dracul Night',
      error: failed.error,
      readOnly: false,
    },
    {
      tool: 'list_themes',
      status: 'done',
      summary: '',
      error: undefined,
      readOnly: true,
    },
  ]);
  const text = await card.innerText();
  assert.ok(!text.includes(PROBE), 'the card never shows the code');
  assert.match(text, /Export the image/, 'rows carry the localized title');
  assert.equal(
    await card.locator('[data-source]').innerText(),
    'WebMCP',
    'the chip names the route',
  );
  assert.equal(
    await card.getByRole('status').count(),
    1,
    'the rows sit in a polite live region',
  );
  await page.screenshot({path: resolve(out, 'agent-activity.png')});

  await card.hover();
  await page.waitForTimeout(6000);
  assert.ok(await card.isVisible(), 'hovering keeps the card open');
  await page.mouse.move(1000, 400);
  await page.waitForTimeout(7000);
  assert.ok(await card.isVisible(), 'the card waits after the last call');
  await card.waitFor({state: 'detached', timeout: 6000});

  await page.setViewportSize({width: 390, height: 844});
  const devtools = await page.evaluate(() => {
    let group;
    const event = new Event('devtoolstooldiscovery');
    event.respondWith = value => (group = value);
    window.dispatchEvent(event);
    return group.tools
      .find(tool => tool.name === 'apply_theme')
      .execute({theme: 'Night Owl'})
      .then(result => result.ok);
  });
  assert.equal(devtools, true);
  await card.locator('li[data-status="done"]').first().waitFor();
  assert.equal(await card.locator('[data-source]').innerText(), 'DevTools MCP');
  assert.ok(
    (await rows(page)).length > 1,
    'the hidden card kept its calls for the next one',
  );
  await page.waitForTimeout(300);
  const phone = await card.boundingBox();
  assert.ok(
    Math.abs(phone.x - 16) <= 1 && Math.abs(phone.width - (390 - 32)) <= 1,
    `phone card spans the width less 16px gutters: ${JSON.stringify(phone)}`,
  );
  await page.screenshot({path: resolve(out, 'agent-activity-phone.png')});
  await card.getByRole('button', {name: 'Dismiss'}).click();
  await card.waitFor({state: 'detached', timeout: 1000});
  await page.setViewportSize({width: 1440, height: 1000});

  await page.goto(`${new URL(page.url()).origin}/?whatsNew=nudge`);
  await page.waitForFunction(() => window.__webmcpTools?.size === 11);
  const nudge = page.locator('[data-whats-new="nudge"]');
  await nudge.waitFor();
  await page.waitForTimeout(600);
  await call('get_editor_state', {});
  await card.waitFor();
  await page.waitForTimeout(400);
  const above = await card.boundingBox();
  const below = await nudge.boundingBox();
  assert.ok(
    above.y + above.height <= below.y,
    `the card sits above the What's new Nudge: ${JSON.stringify({above, below})}`,
  );
  await page.screenshot({path: resolve(out, 'agent-activity-nudge.png')});

  return {rows: 6, phoneWidth: phone.width};
}
