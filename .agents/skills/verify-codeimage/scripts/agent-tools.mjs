import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {PNG} from 'pngjs';

const TOOLS = [
  'get_editor_state',
  'list_themes',
  'set_code',
  'apply_theme',
  'set_controls',
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
      assert.deepEqual(coded, {ok: true, language: 'python'});
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

      const control = (snapshot, id) =>
        snapshot.controls.find(control => control.id === id);
      const before = await state();
      const padding = control(before, 'frame.padding');
      const target = padding.options.find(
        option => option.value !== padding.value,
      ).value;
      const framePadding = () =>
        page
          .locator('[data-fit-scale] [data-watermark-frame]')
          .first()
          .evaluate(element => getComputedStyle(element).paddingLeft);
      const paddingBefore = await framePadding();
      assert.deepEqual(
        await call('set_controls', {values: {'frame.padding': target}}),
        {ok: true, applied: {'frame.padding': target}},
      );
      assert.equal(control(await state(), 'frame.padding').value, target);
      assert.notEqual(
        await framePadding(),
        paddingBefore,
        'the live frame shows the new padding',
      );

      const opacity = control(await state(), 'frame.opacity').value;
      const outOfRange = await call('set_controls', {
        values: {'frame.opacity': 150},
      });
      assert.equal(outOfRange.ok, false);
      assert.deepEqual(outOfRange.applied, {});
      assert.match(outOfRange.errors['frame.opacity'], /from 0 to 100/);
      assert.equal(control(await state(), 'frame.opacity').value, opacity);

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

      return {
        png1x: [one.width, one.height],
        png2x: [two.width, two.height],
        padding: target,
        devtoolsTheme: devtools.result.theme.id,
      };
    },
  );
}
