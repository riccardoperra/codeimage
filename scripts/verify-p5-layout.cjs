const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {chromium} = require('playwright');
const {PNG} = require('pngjs');

const out = process.env.P5_OUT ?? '/tmp/p5-layout';
const baseline = !!process.env.P5_BASELINE;
const phase = baseline ? 'before' : 'after';
const themes = [
  'fleetDark',
  'dracula',
  'githubLight',
  'materialLightTheme',
  'oneLight',
];
const terminals = ['macOs', 'macOsGrayTheme', 'macOsOutlineTheme', 'windows'];
const marks = {
  lines: [
    {line: 2, kind: 'added'},
    {line: 3, kind: 'removed'},
    {line: 5, kind: 'highlight'},
  ],
  focusedLines: [],
};

async function main() {
  fs.mkdirSync(out, {recursive: true});
  const browser = await chromium.launch({headless: true});
  const page = await browser.newPage({viewport: {width: 1280, height: 900}});
  const results = [];
  try {
    const worker = path.join(
      path.dirname(
        require.resolve('msw/package.json', {
          paths: [path.join(__dirname, '../apps/codeimage')],
        }),
      ),
      'lib/mockServiceWorker.js',
    );
    await page.route('**/mockServiceWorker.js', route =>
      route.fulfill({path: worker, contentType: 'text/javascript'}),
    );
    await page.addInitScript(() =>
      performance.setResourceTimingBufferSize(10000),
    );
    await page.goto(process.env.P5_URL ?? 'http://localhost:4451');
    await page.locator('[contenteditable=true]').first().waitFor();
    const close = page.getByRole('button', {name: 'close', exact: true});
    if (await close.isVisible()) await close.click();
    await page.evaluate(async () => {
      const {EditorView} =
        await import('/node_modules/.vite/deps/@codemirror_view.js');
      window.view = EditorView.findFromDOM(
        document.querySelector('[contenteditable=true]'),
      );
      window.marks = await import(
        performance
          .getEntriesByType('resource')
          .find(e => e.name.includes('/plugins/lineMarks/state.ts')).name
      );
      window.editor = (
        await import('/src/state/editor/index.ts')
      ).getRootEditorStore();
      window.terminal = (
        await import('/src/state/editor/terminal.ts')
      ).getTerminalState();
      window.changeTheme = (
        await import('/src/state/effects/onThemeChange.tsx')
      ).dispatchUpdateTheme;
      editor.actions.setFontId('geist-mono');
      view.dispatch({
        changes: {
          from: 0,
          to: view.state.doc.length,
          insert: Array.from(
            {length: 8},
            (_, i) => `const value${i + 1} = ${i + 1};`,
          ).join('\n'),
        },
      });
    });
    const layout = () =>
      page.evaluate(() => {
        const root = view.dom;
        return [...root.querySelectorAll('.cm-content .cm-line')].map(el => {
          const range = document.createRange();
          range.selectNodeContents(el);
          const r = range.getBoundingClientRect();
          return {x: r.x, y: r.y, width: r.width, height: r.height};
        });
      });
    const capture = async () => {
      await page.getByRole('button', {name: 'Export', exact: true}).click();
      await page.getByRole('button', {name: 'Confirm', exact: true}).waitFor();
      await page.keyboard.press('Escape');
      await page
        .locator('[data-static-code-view]')
        .waitFor({state: 'attached'});
      await page.evaluate(() => document.fonts.ready);
      return await page.evaluate(async () => {
        const root = document.querySelector('[data-static-code-view]');
        const frame = root.closest('[class*=previewWrapper]');
        const win = root.closest('[data-custom-border]');
        const wr = win.getBoundingClientRect();
        const fr = frame.getBoundingClientRect();
        const lines = [...root.querySelectorAll('.cm-content .cm-line')].map(
          el => {
            const r = el.getBoundingClientRect();
            const range = document.createRange();
            range.selectNodeContents(el);
            const text = range.getBoundingClientRect();
            return {
              textX: text.x - fr.x,
              x: r.x - fr.x,
              y: r.y - fr.y,
              width: r.width,
              height: r.height,
            };
          },
        );
        const accent = getComputedStyle(root)
          .getPropertyValue('--codeimage-line-accent')
          .trim();
        const bar =
          root.querySelector('.cm-lineMark-highlight') ??
          root.querySelector('[data-mark="highlight"]');
        const color = bar ? getComputedStyle(bar, '::before').boxShadow : null;
        const {exportImage} = await import('/src/hooks/use-export-image.ts');
        const blob = await exportImage({
          ref: frame,
          options: {
            extension: 'png',
            mode: 'getBlob',
            pixelRatio: 1,
            quality: 1,
          },
        });
        let binary = '';
        for (const byte of new Uint8Array(await blob.arrayBuffer()))
          binary += String.fromCharCode(byte);
        return {
          png: btoa(binary),
          accent,
          color,
          lines,
          window: {
            x: wr.x - fr.x,
            y: wr.y - fr.y,
            width: wr.width,
            height: wr.height,
          },
        };
      });
    };
    for (const theme of themes)
      for (const terminal of terminals)
        for (const numbers of [false, true]) {
          const id = `${theme}-${terminal}-${numbers ? 'numbers' : 'plain'}`;
          if (process.env.P5_ONLY && !id.includes(process.env.P5_ONLY))
            continue;
          await page.evaluate(
            ({theme, terminal, numbers}) => {
              window.terminal.setType(terminal);
              changeTheme({theme});
              editor.actions.setShowLineNumbers(numbers);
              marks.setLineMarks(view, {lines: [], focusedLines: []}, false);
            },
            {theme, terminal, numbers},
          );
          await page.waitForFunction(
            theme => editor.state.options.themeId === theme,
            theme,
          );
          await page.waitForTimeout(120);
          await page.evaluate(async () => {
            await document.fonts.ready;
          });
          const unmarked = await layout();
          await page.evaluate(
            value => marks.setLineMarks(view, value, false),
            marks,
          );
          await page.waitForTimeout(120);
          const marked = await layout();
          if (!baseline)
            assert.deepEqual(
              marked,
              unmarked,
              `${id}: marks must not move code`,
            );
          await page
            .locator('.cm-editor:has([contenteditable=true]) .cm-line')
            .nth(1)
            .hover();
          await page.waitForTimeout(80);
          const editor = await page.evaluate(() => {
            const root = view.dom;
            const line = root.querySelector('[data-mark="added"]');
            const gutter = root.querySelector(
              '.cm-lineNumbers .cm-lineMark-added',
            );
            const edge = gutter ?? line;
            const marker = root.querySelector('[data-mark-line="2"]');
            const band = getComputedStyle(edge, '::before');
            const accent = getComputedStyle(root)
              .getPropertyValue('--codeimage-line-accent')
              .trim();
            return {
              accent,
              marker: marker.getBoundingClientRect().toJSON(),
              line: line.getBoundingClientRect().toJSON(),
              edge: edge.getBoundingClientRect().toJSON(),
              glyphVisibility: getComputedStyle(
                marker.querySelector('.cm-lineMarkGlyph'),
              ).visibility,
              signImage: band.backgroundImage,
              band: {
                left: band.left,
                width: band.width,
                background: band.backgroundColor,
              },
              window: root
                .closest('[data-custom-border]')
                .getBoundingClientRect()
                .toJSON(),
            };
          });
          if (!baseline) {
            assert.equal(
              editor.glyphVisibility,
              'hidden',
              `${id}: duplicate hover sign`,
            );
            assert.notEqual(
              editor.signImage,
              'none',
              `${id}: inset sign missing`,
            );
            assert(
              Math.abs(
                editor.edge.left -
                  parseFloat(editor.band.width) -
                  editor.window.left -
                  1.5,
              ) < 0.1,
              `${id}: left band misaligned`,
            );
            assert(editor.accent, `${id}: missing accent`);
            assert(editor.marker.width >= 20, `${id}: target shrank`);
            assert(
              editor.marker.right <= marked[1].x,
              `${id}: marker covers code`,
            );
          }
          if (theme === 'fleetDark')
            await page.screenshot({path: path.join(out, `${phase}-${id}.png`)});
          await page.mouse.move(0, 0);
          const exported = await capture();
          if (!baseline)
            assert.equal(
              exported.accent,
              editor.accent,
              `${id}: export accent differs`,
            );
          fs.writeFileSync(
            path.join(out, `${phase}-export-${id}.png`),
            Buffer.from(exported.png, 'base64'),
          );
          if (!baseline) {
            await page.evaluate(() =>
              marks.setLineMarks(view, {lines: [], focusedLines: []}, false),
            );
            const clean = await capture();
            assert.deepEqual(
              exported.lines,
              clean.lines,
              `${id}: export text moved`,
            );
            const before = PNG.sync.read(Buffer.from(clean.png, 'base64'));
            const after = PNG.sync.read(Buffer.from(exported.png, 'base64'));
            assert.equal(before.width, after.width);
            assert.equal(before.height, after.height);
            let changed = 0;
            for (let y = 0; y < after.height; y++)
              for (let x = 0; x < after.width; x++) {
                const i = (y * after.width + x) * 4;
                if (
                  before.data
                    .subarray(i, i + 4)
                    .equals(after.data.subarray(i, i + 4))
                )
                  continue;
                changed++;
                assert(
                  marks.lines.some(mark => {
                    const line = exported.lines[mark.line - 1];
                    return (
                      y >= Math.floor(line.y) &&
                      y <= Math.ceil(line.y + line.height)
                    );
                  }),
                  `${id}: pixel changed outside marked rows at ${x},${y}`,
                );
              }
            assert(changed > 0, `${id}: export marks missing`);
            const pixel = (png, x, y) => [
              ...png.data.subarray(
                (y * png.width + x) * 4,
                (y * png.width + x) * 4 + 4,
              ),
            ];
            for (const mark of marks.lines) {
              const row = exported.lines[mark.line - 1];
              const y = Math.floor(row.y + row.height / 2);
              for (const x of [
                Math.ceil(exported.window.x + 2),
                Math.floor(exported.window.x + exported.window.width - 3),
              ]) {
                assert.notDeepEqual(
                  pixel(before, x, y),
                  pixel(after, x, y),
                  `${id}: band stops before window edge at ${x},${y}`,
                );
              }
            }
            exported.changedPixels = changed;
            fs.writeFileSync(
              path.join(out, `unmarked-export-${id}.png`),
              Buffer.from(clean.png, 'base64'),
            );
          }
          delete exported.png;
          results.push({id, unmarked, marked, editor, exported});
          console.log(`${baseline ? 'BASELINE' : 'PASS'} ${id}`);
        }
    fs.writeFileSync(
      path.join(out, `${phase}.json`),
      JSON.stringify(results, null, 2),
    );
  } finally {
    await browser.close();
  }
}
main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
