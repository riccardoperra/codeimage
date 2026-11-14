const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {chromium} = require('playwright');
const {PNG} = require('pngjs');

const out = process.env.P5_OUT ?? '/tmp/p5-gutter';
const initial = {
  lines: [
    {line: 2, kind: 'removed'},
    {line: 3, kind: 'added'},
    {line: 5, kind: 'highlight'},
  ],
  focusedLines: [5, 6],
};

async function main() {
  fs.mkdirSync(out, {recursive: true});
  const browser = await chromium.launch({headless: true});
  const context = await browser.newContext({
    viewport: {width: 1280, height: 900},
    ...(process.env.P5_MEDIA
      ? {recordVideo: {dir: out, size: {width: 960, height: 675}}}
      : {}),
  });
  const worker = path.join(
    path.dirname(
      require.resolve('msw/package.json', {
        paths: [path.join(__dirname, '../apps/codeimage')],
      }),
    ),
    'lib/mockServiceWorker.js',
  );
  await context.route('**/mockServiceWorker.js', route =>
    route.fulfill({path: worker, contentType: 'text/javascript'}),
  );
  const page = await context.newPage();
  await page.addInitScript(() =>
    performance.setResourceTimingBufferSize(10000),
  );
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  try {
    await page.goto(process.env.P5_URL ?? 'http://localhost:4449');
    await page.locator('[contenteditable=true]').first().waitFor();
    const close = page.getByRole('button', {name: 'close', exact: true});
    if (await close.isVisible()) await close.click();
    await page.evaluate(async initial => {
      const {EditorView} =
        await import('/node_modules/.vite/deps/@codemirror_view.js');
      window.view = EditorView.findFromDOM(
        document.querySelector('[contenteditable=true]'),
      );
      const {getRootEditorStore} = await import('/src/state/editor/index.ts');
      getRootEditorStore().actions.setFontId('geist-mono');
      window.marks = await import(
        performance
          .getEntriesByType('resource')
          .find(entry => entry.name.includes('/plugins/lineMarks/state.ts'))
          .name
      );
      view.dispatch({
        changes: {
          from: 0,
          to: view.state.doc.length,
          insert: Array.from(
            {length: 10},
            (_, i) => `const value${i + 1} = ${i + 1};`,
          ).join('\n'),
        },
      });
      marks.setLineMarks(view, initial, false);
    }, initial);
    const read = () => page.evaluate(() => marks.readMarks(view.state));
    const marker = line =>
      page.locator(`.cm-lineMarkMarker[data-mark-line="${line}"]`);
    const editorLine = line =>
      page
        .locator('.cm-editor:has([contenteditable=true]) .cm-line')
        .nth(line - 1);
    // Markers render only for the hovered, caret, focused or open line.
    const openMenu = async line => {
      await editorLine(line).hover();
      await marker(line).click();
    };
    const menu = page.getByRole('menu', {name: 'Line marks'});
    const item = name =>
      menu.getByRole(
        name === 'Focus'
          ? 'menuitemcheckbox'
          : name === 'Remove mark'
            ? 'menuitem'
            : 'menuitemradio',
        {name, exact: true},
      );
    const select = (from, to = from) =>
      page.evaluate(
        ({from, to}) => {
          view.dispatch({
            selection: {
              anchor: view.state.doc.line(from).from,
              head:
                from === to
                  ? view.state.doc.line(from).from
                  : view.state.doc.line(to).to,
            },
          });
          view.focus();
        },
        {from, to},
      );
    const undo = async () => {
      await page.waitForFunction(() =>
        document.activeElement?.matches('.cm-lineMarkMarker'),
      );
      await page.keyboard.press('Meta+z');
    };
    const ghostOpacity = line =>
      marker(line)
        .locator('.cm-lineMarkGlyph')
        .evaluate(el => getComputedStyle(el, '::before').opacity);
    if (!process.env.P5_BASELINE && !process.env.P5_EXPORT_ONLY) {
      await editorLine(1).hover();
      await marker(1).waitFor({timeout: 2000});
      const overlay = await page.evaluate(() => {
        const gutter = view.dom.querySelector('.cm-lineMarkGutter');
        const before = view.contentDOM.getBoundingClientRect().toJSON();
        gutter.style.setProperty('display', 'none', 'important');
        const after = view.contentDOM.getBoundingClientRect().toJSON();
        gutter.style.removeProperty('display');
        return {before, after};
      });
      assert.deepEqual(
        overlay.before,
        overlay.after,
        'markers must not move or narrow the code',
      );
      assert((await marker(1).boundingBox()).width >= 20);
      await page.mouse.move(0, 0);
      await page.waitForFunction(
        () =>
          !document.querySelector('.cm-lineMarkMarker[data-hovered]') &&
          [...document.querySelectorAll('.cm-lineMarkMarker')].every(
            el =>
              !el.matches(':popover-open') ||
              getComputedStyle(el).opacity === '0',
          ),
      );
      assert(
        (await page.locator('.cm-lineMarkMarker:popover-open').count()) <= 1,
        'only the caret line keeps a marker at rest',
      );

      assert.equal(await page.locator('.cm-lineMarkClear').count(), 0);
      assert.equal(await ghostOpacity(1), '0');
      await editorLine(1).hover();
      assert.equal(await ghostOpacity(1), '0.5');
      await page
        .locator('.cm-editor:has([contenteditable=true]) .cm-line')
        .first()
        .hover();
      assert.equal(
        await marker(1).evaluate(el => getComputedStyle(el).opacity),
        '1',
      );

      await openMenu(1);
      assert.equal(await item('Remove mark').isDisabled(), true);
      if (process.env.P5_MEDIA) await page.waitForTimeout(650);
      await item('Added').click();
      assert(
        (await read()).lines.some(
          mark => mark.line === 1 && mark.kind === 'added',
        ),
      );
      await undo();
      assert.deepEqual(await read(), initial);
      await page.waitForFunction(() =>
        document.activeElement?.matches('.cm-lineMarkMarker'),
      );
      await page.keyboard.press('Meta+Shift+z');
      assert(
        (await read()).lines.some(
          mark => mark.line === 1 && mark.kind === 'added',
        ),
      );
      await undo();
      assert.deepEqual(await read(), initial);
      console.log('PASS menu applies to one line and undo restores every mark');
      await select(4, 6);
      await openMenu(5);
      assert.equal(
        await menu.locator('.cm-lineMarkMenuHeader').innerText(),
        'Lines 4–6 (selection)',
      );
      if (process.env.P5_MEDIA) {
        await page.waitForTimeout(750);
        await page.screenshot({path: path.join(out, 'dark-selection.png')});
      }
      assert.equal(
        await item('Highlight').getAttribute('aria-checked'),
        'false',
      );
      assert.equal(await item('Focus').getAttribute('aria-checked'), 'false');
      await item('Highlight').click();
      assert.deepEqual(
        (await read()).lines.filter(mark => mark.line >= 4),
        [4, 5, 6].map(line => ({line, kind: 'highlight'})),
      );
      await openMenu(5);
      assert.equal(
        await item('Highlight').getAttribute('aria-checked'),
        'true',
      );
      await item('Highlight').click();
      assert.deepEqual((await read()).focusedLines, [5, 6]);
      assert(!(await read()).lines.some(mark => mark.line >= 4));
      await undo();
      await openMenu(5);
      await item('Focus').click();
      assert.deepEqual((await read()).focusedLines, [4, 5, 6]);
      await openMenu(5);
      await item('Remove mark').click();
      assert.deepEqual(await read(), {
        lines: initial.lines.slice(0, 2),
        focusedLines: [],
      });
      await undo();
      assert.deepEqual((await read()).focusedLines, [4, 5, 6]);
      assert.deepEqual(
        (await read()).lines.filter(mark => mark.line >= 4),
        [4, 5, 6].map(line => ({line, kind: 'highlight'})),
      );
      console.log(
        'PASS selection scope, all-selected checks, kind toggling, additive focus, removal and exact undo',
      );
      await openMenu(9);
      assert.equal(
        await menu.locator('.cm-lineMarkMenuHeader').innerText(),
        'Line 9',
      );
      await page.keyboard.press('Escape');
      assert.equal(
        await marker(9).evaluate(el => el === document.activeElement),
        true,
      );
      await page.keyboard.press('ArrowUp');
      await page.waitForFunction(() =>
        document.activeElement?.matches('[data-mark-line="8"]'),
      );
      assert.equal(
        await page.evaluate(
          () =>
            [...document.querySelectorAll('.cm-lineMarkMarker')].filter(
              el => el.matches(':popover-open') && el.tabIndex === 0,
            ).length,
        ),
        1,
        'markers expose a single Tab stop',
      );
      await page.keyboard.press('ArrowDown');
      await page.waitForFunction(() =>
        document.activeElement?.matches('[data-mark-line="9"]'),
      );
      await page.keyboard.press('Enter');
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('Enter');
      assert(
        (await read()).lines.some(
          mark => mark.line === 9 && mark.kind === 'removed',
        ),
      );
      await marker(9).press('Space');
      await page.keyboard.press('Escape');
      assert.equal(
        await marker(9).evaluate(el => el === document.activeElement),
        true,
      );
      console.log(
        'PASS mouse and keyboard menu, outside-selection scope, and Escape focus return',
      );
      const tall = await page.evaluate(async () => {
        const end = view.state.doc.length;
        view.dispatch({changes: {from: end, insert: '\n'.repeat(60)}});
        let scroller = view.dom.parentElement;
        while (
          scroller &&
          !(
            scroller.scrollHeight > scroller.clientHeight + 5 &&
            /auto|scroll/.test(getComputedStyle(scroller).overflowY)
          )
        )
          scroller = scroller.parentElement;
        scroller.scrollTop = 400;
        await new Promise(resolve => setTimeout(resolve, 300));
        const markers = [...document.querySelectorAll('.cm-lineMarkMarker')];
        const rendered = markers.filter(
          el =>
            !el.matches(':popover-open') &&
            getComputedStyle(el).display !== 'none',
        ).length;
        const covering = markers
          .filter(el => el.matches(':popover-open'))
          .filter(el => {
            const rect = el.getBoundingClientRect();
            el.style.pointerEvents = 'none';
            const under = document.elementFromPoint(
              rect.x + 10,
              rect.y + rect.height / 2,
            );
            el.style.pointerEvents = '';
            return !view.dom.contains(under);
          }).length;
        scroller.scrollTop = 0;
        view.dispatch({changes: {from: end, to: view.state.doc.length}});
        await new Promise(resolve => setTimeout(resolve, 300));
        return {rendered, covering};
      });
      assert.deepEqual(
        tall,
        {rendered: 0, covering: 0},
        'markers must not render while closed or cover the header and dock',
      );
      console.log(
        'PASS markers stay inside the visible editor after scrolling',
      );
    }
    await page.evaluate(
      initial => marks.setLineMarks(view, initial, false),
      initial,
    );
    await page.getByRole('button', {name: 'Export', exact: true}).click();
    await page.getByRole('button', {name: 'Confirm', exact: true}).waitFor();
    await page.keyboard.press('Escape');
    await page.locator('[data-static-code-view]').waitFor({state: 'attached'});
    await page.waitForLoadState('networkidle');
    const layout = await page.evaluate(async () => {
      const root = document.querySelector('[data-static-code-view]');
      const line = root.querySelector('.cm-line');
      const style = getComputedStyle(line);
      await document.fonts.load(
        `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`,
      );
      await document.fonts.ready;
      return {
        root: root.getBoundingClientRect().toJSON(),
        line: line.getBoundingClientRect().toJSON(),
        font: [
          style.fontFamily,
          style.fontSize,
          style.fontWeight,
          style.letterSpacing,
        ],
        frame: root
          .closest('[class*=previewWrapper]')
          .getBoundingClientRect()
          .toJSON(),
      };
    });
    fs.writeFileSync(
      path.join(
        out,
        process.env.P5_BASELINE ? 'before-layout.json' : 'after-layout.json',
      ),
      JSON.stringify(layout, null, 2),
    );
    const png = await page.evaluate(async () => {
      await document.fonts.ready;
      const root = document.querySelector('[data-static-code-view]');
      const assertNoControls = root.querySelector(
        '.cm-lineMarkMarker, .cm-lineMarkMenu, .cm-lineMarkFocusDot',
      );
      if (assertNoControls)
        throw new Error('Interactive gutter leaked into export');
      const {exportImage} = await import('/src/hooks/use-export-image.ts');
      const blob = await exportImage({
        ref: root.closest('[class*=previewWrapper]'),
        options: {extension: 'png', mode: 'getBlob', pixelRatio: 1, quality: 1},
      });
      let binary = '';
      for (const byte of new Uint8Array(await blob.arrayBuffer()))
        binary += String.fromCharCode(byte);
      return btoa(binary);
    });
    fs.writeFileSync(
      path.join(out, process.env.P5_BASELINE ? 'before.png' : 'after.png'),
      Buffer.from(png, 'base64'),
    );
    if (process.env.P5_BASELINE) {
      console.log('Saved PNG reference');
      return;
    }
    const before = PNG.sync.read(
      fs.readFileSync(
        process.env.P5_BASELINE_PATH ??
          path.join(
            __dirname,
            '../docs/plans/media/p5-gutter/final/export-reference.png',
          ),
      ),
    );
    const after = PNG.sync.read(Buffer.from(png, 'base64'));
    assert.equal(after.width, before.width);
    assert.equal(after.height, before.height);
    assert(
      after.data.equals(before.data),
      'PNG pixels differ from the reviewed reference',
    );
    console.log('PASS PNG export matches the reviewed reference');
    if (!process.env.P5_EXPORT_ONLY) {
      await page.evaluate(async () => {
        const {getRootEditorStore} = await import('/src/state/editor/index.ts');
        getRootEditorStore().actions.setShowLineNumbers(true);
      });
      await select(4, 6);
      await openMenu(5);
      if (process.env.P5_MEDIA) {
        await page.waitForTimeout(600);
        await page.screenshot({path: path.join(out, 'dark-selection.png')});
      }
      await page.keyboard.press('Escape');
      await page.evaluate(async () => {
        const {getUiStore} = await import('/src/state/ui.ts');
        const {getRootEditorStore} = await import('/src/state/editor/index.ts');
        getUiStore().setThemeMode('light');
        const {dispatchUpdateTheme} =
          await import('/src/state/effects/onThemeChange.tsx');
        dispatchUpdateTheme({theme: 'githubLight'});
        getRootEditorStore().actions.setShowLineNumbers(true);
      });
      await openMenu(5);
      if (process.env.P5_MEDIA) {
        await page.waitForTimeout(750);
        await page.screenshot({path: path.join(out, 'light-selection.png')});
      }
      const markerBox = await marker(5).boundingBox();
      const numbersBox = await page
        .locator('.cm-editor:has([contenteditable=true]) .cm-lineNumbers')
        .boundingBox();
      assert(
        markerBox.x < numbersBox.x,
        'mark gutter must precede line numbers',
      );
      const numberStart = await page
        .locator(
          '.cm-editor:has([contenteditable=true]) .cm-lineNumbers .cm-gutterElement',
        )
        .filter({hasText: /^5$/})
        .evaluate(el => {
          const range = document.createRange();
          range.selectNodeContents(el);
          return range.getBoundingClientRect().left;
        });
      assert(
        markerBox.x + markerBox.width <= numberStart,
        'marker must not cover line numbers',
      );
      await page.keyboard.press('Escape');
      console.log(
        'PASS light and dark themes and marker gutter before line numbers',
      );
      const session = await context.newCDPSession(page);
      await session.send('Emulation.setTouchEmulationEnabled', {
        enabled: true,
        maxTouchPoints: 1,
      });
      await page.setViewportSize({width: 390, height: 844});
      await page.reload({waitUntil: 'domcontentloaded'});
      await page.locator('[contenteditable=true]').first().waitFor();
      await page.evaluate(async initial => {
        const {EditorView} =
          await import('/node_modules/.vite/deps/@codemirror_view.js');
        window.view = EditorView.findFromDOM(
          document.querySelector('[contenteditable=true]'),
        );
        window.marks = await import(
          performance
            .getEntriesByType('resource')
            .find(entry => entry.name.includes('/plugins/lineMarks/state.ts'))
            .name
        );
        marks.setLineMarks(view, initial, false);
        const {getRootEditorStore} = await import('/src/state/editor/index.ts');
        getRootEditorStore().actions.setShowLineNumbers(true);
      }, initial);
      assert.equal(
        await page.evaluate(() => matchMedia('(pointer: coarse)').matches),
        true,
      );
      const tap = async target => {
        const rect = await target.boundingBox();
        await session.send('Input.dispatchTouchEvent', {
          type: 'touchStart',
          touchPoints: [
            {x: rect.x + rect.width / 2, y: rect.y + rect.height / 2},
          ],
        });
        await session.send('Input.dispatchTouchEvent', {
          type: 'touchEnd',
          touchPoints: [],
        });
      };
      await tap(editorLine(1));
      await page.waitForFunction(() =>
        document.querySelector('[data-mark-line="1"][data-active]'),
      );
      assert.equal(
        await marker(1).evaluate(el => getComputedStyle(el).opacity),
        '1',
        'touch reveals the caret line marker',
      );
      const touchTarget = await marker(1).boundingBox();
      assert(
        touchTarget.width >= 20 && touchTarget.height >= 24,
        'touch target must stay at least 20x24 after canvas scaling',
      );
      const touchBox = await marker(1).boundingBox();
      const touchNumberStart = await page
        .locator(
          '.cm-editor:has([contenteditable=true]) .cm-lineNumbers .cm-gutterElement',
        )
        .filter({hasText: /^1$/})
        .evaluate(el => {
          const range = document.createRange();
          range.selectNodeContents(el);
          return range.getBoundingClientRect().left;
        });
      assert(
        touchBox.x + touchBox.width <= touchNumberStart,
        'touch marker must not cover line numbers',
      );
      await tap(marker(1));
      await menu.waitFor();
      assert.equal(
        await page.locator('.cm-lineMarkMarker[data-hovered]').count(),
        0,
        'touch must not leave a sticky hover',
      );
      const box = await menu.boundingBox();
      assert(box.x >= 8 && box.x + box.width <= 382);
      if (process.env.P5_MEDIA) {
        await page.waitForTimeout(750);
        await page.screenshot({path: path.join(out, 'touch-390.png')});
      }
      await tap(item('Focus'));
      await page.waitForFunction(() =>
        marks.readMarks(view.state).focusedLines.includes(1),
      );
      assert((await read()).focusedLines.includes(1));
      console.log(
        'PASS 390px touch, empty-cell tapping, no sticky hover, and menu containment',
      );
      await session.detach();
    }

    assert.deepEqual(errors, []);
  } finally {
    const video = page.video();
    await context.close();
    if (video) {
      await video.saveAs(path.join(out, 'gutter-markers.webm'));
      await video.delete();
    }
    await browser.close();
  }
}
main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
