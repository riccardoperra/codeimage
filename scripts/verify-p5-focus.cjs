const {chromium} = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {PNG} = require('pngjs');

const out = process.env.P5_OUT ?? '/tmp/p5-focus';
const code = Array.from(
  {length: 8},
  (_, i) => `const value${i + 1} = ${i + 1};`,
).join('\n');
async function main() {
  fs.mkdirSync(out, {recursive: true});
  const browser = await chromium.launch({
    headless: true,
    executablePath:
      process.env.P5_CHROMIUM ??
      path.join(
        process.env.HOME,
        'Library/Caches/ms-playwright/chromium-1200/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing',
      ),
  });
  const context = await browser.newContext({
    viewport: {width: 1280, height: 900},
    recordVideo: {dir: out, size: {width: 1280, height: 900}},
  });
  const workerPath = path.join(
    path.dirname(
      require.resolve('msw/package.json', {
        paths: [path.join(__dirname, '../apps/codeimage')],
      }),
    ),
    'lib/mockServiceWorker.js',
  );
  await context.route('**/mockServiceWorker.js', route =>
    route.fulfill({path: workerPath, contentType: 'text/javascript'}),
  );
  const page = await context.newPage();
  const pause = () => page.waitForTimeout(Number(process.env.P5_STEP_MS ?? 0));
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.setDefaultTimeout(20000);
  try {
    await page.goto(process.env.P5_URL ?? 'http://127.0.0.1:4447/', {
      waitUntil: 'domcontentloaded',
    });
    const editor = page.locator('[contenteditable=true]').first();
    await editor.waitFor();
    const close = page.getByRole('button', {name: 'close', exact: true});
    if (await close.isVisible()) await close.click();
    await page.evaluate(async code => {
      const {EditorView} =
        await import('/node_modules/.vite/deps/@codemirror_view.js');
      window.view = EditorView.findFromDOM(
        document.querySelector('[contenteditable=true]'),
      );
      window.marks =
        await import('/src/components/CustomEditor/plugins/lineMarks/state.ts');
      view.dispatch({
        changes: {from: 0, to: view.state.doc.length, insert: code},
      });
      view.focus();
    }, code);
    const read = () => page.evaluate(() => marks.readMarks(view.state));
    const select = (from, to = from) =>
      page.evaluate(
        ({from, to}) => {
          view.dispatch({
            selection: {
              anchor: view.state.doc.line(from).from,
              head: view.state.doc.line(to).to,
            },
          });
          view.focus();
        },
        {from, to},
      );
    const cursor = line =>
      page
        .evaluate(line => {
          view.dispatch({selection: {anchor: view.state.doc.line(line).to}});
          view.focus();
        }, line)
        .then(pause);
    const action = async (from, to, name) => {
      await select(from, to);
      await page
        .locator('.cm-lineMarkToolbar:not(.cm-lineMarkClear)')
        .getByRole('button', {name, exact: true})
        .click();
      await pause();
    };
    await action(2, 3, 'Focus');
    await action(6, 7, 'Focus');
    assert.deepEqual((await read()).focusedLines, [2, 3, 6, 7]);
    assert.deepEqual(
      await page
        .locator('.cm-editor:has([contenteditable=true]) .cm-line')
        .evaluateAll(lines =>
          lines.map(line => getComputedStyle(line).opacity),
        ),
      ['0.35', '1', '1', '0.35', '0.35', '1', '1', '0.35'],
    );
    await action(2, 2, 'Highlight');
    await action(4, 4, 'Highlight');
    await cursor(2);
    await page
      .getByRole('button', {name: 'Clear highlight', exact: true})
      .waitFor();
    await page.screenshot({path: path.join(out, 'p5-focus-clear-desktop.png')});
    await page
      .getByRole('button', {name: 'Clear highlight', exact: true})
      .click();
    assert.deepEqual((await read()).lines, [{line: 4, kind: 'highlight'}]);
    assert.deepEqual((await read()).focusedLines, [2, 3, 6, 7]);
    await page.keyboard.press('Meta+z');
    assert.deepEqual((await read()).lines, [
      {line: 2, kind: 'highlight'},
      {line: 4, kind: 'highlight'},
    ]);
    await page.getByRole('button', {name: 'Clear focus', exact: true}).click();
    assert.deepEqual((await read()).focusedLines, [6, 7]);
    assert.equal((await read()).lines.length, 2);
    await page.keyboard.press('Meta+z');
    assert.deepEqual((await read()).focusedLines, [2, 3, 6, 7]);
    console.log('PASS two focus ranges, the chip clears one range, undo');

    await select(6, 7);
    const focusButton = page
      .locator('.cm-lineMarkToolbar:not(.cm-lineMarkClear)')
      .getByRole('button', {name: 'Focus', exact: true});
    assert.equal(await focusButton.getAttribute('aria-pressed'), 'true');
    await select(5, 6);
    assert.equal(await focusButton.getAttribute('aria-pressed'), 'false');
    await action(6, 7, 'Focus');
    assert.deepEqual((await read()).focusedLines, [2, 3]);
    await page.keyboard.press('Meta+z');
    assert.deepEqual((await read()).focusedLines, [2, 3, 6, 7]);
    console.log('PASS Focus shows its pressed state and toggles off');

    await cursor(8);
    await page.keyboard.press('Meta+Alt+4');
    assert.deepEqual((await read()).focusedLines, [2, 3, 6, 7, 8]);
    await page.keyboard.press('Meta+z');
    assert.deepEqual((await read()).focusedLines, [2, 3, 6, 7]);
    await page.keyboard.type(' // typing');
    assert.equal(await page.locator('.cm-lineMarkClear').count(), 0);
    await page.keyboard.press('Meta+z');
    assert.equal(await page.evaluate(() => view.state.doc.toString()), code);
    const rows = page.locator('.cm-editor:has([contenteditable=true]) .cm-line');
    await rows.nth(1).hover();
    assert.equal(await page.locator('.cm-lineMarkClear').count(), 0);
    const row = await rows.nth(1).boundingBox();
    const start = {x: row.x + 40, y: row.y + row.height / 2};
    await page.mouse.click(start.x, start.y);
    const chipBox = await page.locator('.cm-lineMarkClear').boundingBox();
    const end = {
      x: chipBox.x + chipBox.width / 2,
      y: chipBox.y + chipBox.height / 2,
    };
    for (let step = 1; step <= 8; step++) {
      await page.mouse.move(
        start.x + ((end.x - start.x) * step) / 8,
        start.y + ((end.y - start.y) * step) / 8,
      );
      assert.equal(await page.locator('.cm-lineMarkClear').count(), 1);
    }
    await page.mouse.down();
    await page.mouse.up();
    assert.deepEqual((await read()).lines, [{line: 4, kind: 'highlight'}]);
    await page.keyboard.press('Meta+z');
    console.log('PASS the chip follows the caret and stays under the pointer');

    await page.getByRole('button', {name: 'Export', exact: true}).click();
    await page.getByRole('button', {name: 'Confirm', exact: true}).waitFor();
    await pause();
    await page.keyboard.press('Escape');
    await page.locator('[data-static-code-view]').waitFor({state: 'attached'});
    const exportPng = async file => {
      const result = await page.evaluate(async () => {
        const {exportImage} = await import('/src/hooks/use-export-image.ts');
        const root = document.querySelector('[data-static-code-view]');
        const ref = root.closest('[class*=previewWrapper]');
        if (root.querySelector('.cm-lineMarkToolbar'))
          throw new Error('Editor controls leaked into export');
        const blob = await exportImage({
          ref,
          options: {
            extension: 'png',
            mode: 'getBlob',
            pixelRatio: 1,
            quality: 1,
          },
        });
        const box = ref.firstChild.getBoundingClientRect();
        const rows = [...root.querySelectorAll('.cm-line')].map(line => {
          const r = line.getBoundingClientRect();
          return {
            top: (r.top - box.top) / box.height,
            bottom: (r.bottom - box.top) / box.height,
          };
        });
        const bytes = new Uint8Array(await blob.arrayBuffer());
        let binary = '';
        for (const byte of bytes) binary += String.fromCharCode(byte);
        return {png: btoa(binary), rows};
      });
      const buffer = Buffer.from(result.png, 'base64');
      fs.writeFileSync(path.join(out, file), buffer);
      return {...result, buffer};
    };
    await cursor(2);
    const focused = await exportPng('p5-focus-redesign.png');
    await cursor(8);
    const withoutChip = await exportPng('p5-focus-no-chip.png');
    assert.deepEqual(focused.buffer, withoutChip.buffer);
    await action(2, 3, 'Clear');
    assert.deepEqual((await read()).focusedLines, [6, 7]);
    await action(6, 7, 'Clear');
    assert.deepEqual((await read()).focusedLines, []);
    assert.equal(
      await page
        .locator('.cm-editor:has([contenteditable=true])')
        .getAttribute('data-line-focus'),
      'false',
    );
    await page.evaluate(() =>
      marks.setLineMarks(view, {
        lines: [
          {line: 2, kind: 'highlight'},
          {line: 4, kind: 'highlight'},
        ],
        focusedLines: [],
      }),
    );
    const baseline = await exportPng('p5-focus-off.png');
    const a = PNG.sync.read(focused.buffer),
      b = PNG.sync.read(baseline.buffer);
    assert.equal(a.width, b.width);
    assert.equal(a.height, b.height);
    const rowChanges = focused.rows.map(row => {
      let changed = 0;
      for (
        let y = Math.ceil(row.top * a.height);
        y < Math.floor(row.bottom * a.height);
        y++
      ) {
        for (let x = 0; x < a.width; x++) {
          const i = (y * a.width + x) * 4;
          if (
            a.data[i] !== b.data[i] ||
            a.data[i + 1] !== b.data[i + 1] ||
            a.data[i + 2] !== b.data[i + 2]
          )
            changed++;
        }
      }
      return changed;
    });
    assert.equal(rowChanges.length, 8);
    for (const line of [2, 3, 6, 7]) assert.equal(rowChanges[line - 1], 0);
    for (const line of [1, 4, 5, 8]) assert.ok(rowChanges[line - 1] > 0);
    fs.writeFileSync(
      path.join(out, 'p5-focus-png-check.json'),
      JSON.stringify(
        {
          width: a.width,
          height: a.height,
          rowChanges,
          overlayExportIdentical: true,
        },
        null,
        2,
      ),
    );
    console.log(
      'PASS clearing all focus, PNG dimming and overlay exclusion',
      rowChanges,
    );

    await page.setViewportSize({width: 390, height: 844});
    // CodeImage chooses its mobile layout once at mount.
    await page.reload({waitUntil: 'domcontentloaded'});
    await editor.waitFor();
    await page.evaluate(async code => {
      const {EditorView} =
        await import('/node_modules/.vite/deps/@codemirror_view.js');
      window.view = EditorView.findFromDOM(
        document.querySelector('[contenteditable=true]'),
      );
      window.marks =
        await import('/src/components/CustomEditor/plugins/lineMarks/state.ts');
      view.dispatch({
        changes: {from: 0, to: view.state.doc.length, insert: code},
      });
      marks.setLineMarks(view, {
        lines: [{line: 2, kind: 'highlight'}],
        focusedLines: [],
      });
      view.focus();
    }, code);
    await action(2, 3, 'Focus');
    await action(6, 7, 'Focus');
    await cursor(2);
    const chip = page.locator('.cm-lineMarkClear');
    await chip.waitFor();
    const box = await chip.boundingBox();
    assert.ok(box.x >= 0 && box.x + box.width <= 390);
    await page.screenshot({path: path.join(out, 'p5-focus-clear-mobile.png')});
    await page.getByRole('button', {name: 'Clear focus', exact: true}).click();
    assert.deepEqual((await read()).focusedLines, [6, 7]);
    console.log('PASS mobile 390px clear chip', box);
    assert.deepEqual(errors, []);
  } catch (error) {
    await page.screenshot({path: path.join(out, 'failure.png')});
    throw error;
  } finally {
    const video = page.video();
    await context.close();
    if (video) await video.saveAs(path.join(out, 'p5-focus-redesign.webm'));
    await browser.close();
  }
}
main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
