const {chromium} = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const out = process.env.P5_OUT ?? '/tmp/swarm-p5-undo';
const patch =
  'diff --git a/foo.ts b/foo.ts\n--- a/foo.ts\n+++ b/foo.ts\n@@ -1,2 +1,2 @@\n-const old = 1;\n+const next = 2;\n console.log(next);\n';
const diff = patch + patch.replaceAll('foo.ts', 'bar.ts');

async function main() {
  fs.mkdirSync(out, {recursive: true});
  const browser = await chromium.launch({
    executablePath:
      process.env.P5_CHROMIUM ??
      path.join(
        process.env.HOME,
        'Library/Caches/ms-playwright/chromium-1200/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing',
      ),
    headless: true,
  });
  try {
    const page = await browser.newPage({viewport: {width: 1440, height: 1000}});
    page.setDefaultTimeout(60000);
    await page.addInitScript(() =>
      performance.setResourceTimingBufferSize(10000),
    );
    page.on('pageerror', error => console.error('PAGEERROR', error.message));
    await page.goto(process.env.P5_URL ?? 'http://localhost:4433', {
      waitUntil: 'domcontentloaded',
      timeout: 60000,
    });
    const editor = page.locator('[contenteditable=true]').first();
    await editor.waitFor();
    const close = page.getByRole('button', {name: 'close', exact: true});
    if (await close.isVisible()) await close.click();
    await page.evaluate(async () => {
      const {EditorView} =
        await import('/node_modules/.vite/deps/@codemirror_view.js');
      window.view = EditorView.findFromDOM(
        document.querySelector('[contenteditable=true]'),
      );
      const resources = performance
        .getEntriesByType('resource')
        .map(entry => entry.name);
      const storeUrl = resources.find(url =>
        /\/state\/editor\/index.ts(?:\?|$)/.test(url),
      );
      const marksUrl = resources.find(url =>
        /\/lineMarks\/state.ts(?:\?|$)/.test(url),
      );
      window.store = (await import(storeUrl)).getRootEditorStore();
      window.markTools = await import(marksUrl);
      store.actions.addEditor(
        {
          tab: {tabName: 'original.py'},
          code: 'before paste',
          languageId: 'python',
          lineNumberStart: 7,
        },
        true,
      );
    });
    await page.waitForFunction(
      () => view.state.doc.toString() === 'before paste',
    );

    async function snapshot() {
      return page.evaluate(() =>
        JSON.parse(
          JSON.stringify({
            editors: store.state.editors,
            activeEditorId: store.state.activeEditorId,
          }),
        ),
      );
    }
    async function offer() {
      await editor.evaluate((element, text) => {
        view.dispatch({selection: {anchor: 0, head: view.state.doc.length}});
        view.focus();
        const clipboardData = new DataTransfer();
        clipboardData.setData('text/plain', text);
        element.dispatchEvent(
          new ClipboardEvent('paste', {
            clipboardData,
            bubbles: true,
            cancelable: true,
          }),
        );
        markTools.setLineMarks(view, {
          lines: [{line: 3, kind: 'highlight'}],
          focus: true,
        });
      }, diff);
      await page
        .getByRole('button', {name: 'Import as diff', exact: true})
        .waitFor();
    }
    async function verifyRestored(before, name) {
      assert.deepEqual(
        await snapshot(),
        before,
        name + ' restores every tab and the active tab',
      );
      assert.deepEqual(
        await page.evaluate(() => ({
          code: view.state.doc.toString(),
          marks: markTools.readMarks(view.state),
        })),
        {
          code: before.editors[1].code,
          marks: before.editors[1].marks,
        },
        name + ' restores the live editor code and marks',
      );
      await page.screenshot({path: path.join(out, name + '.png')});
      console.log('PASS', name);
    }

    await offer();
    const before = await snapshot();
    await page.screenshot({path: path.join(out, 'pre-import.png')});
    await page
      .getByRole('button', {name: 'Import as diff', exact: true})
      .click();
    assert.deepEqual(
      (await snapshot()).editors.map(tab => tab.tab.tabName),
      ['index.tsx', 'foo.ts', 'bar.ts'],
    );
    const imported = await snapshot();
    await page.screenshot({path: path.join(out, 'imported.png')});
    await page.keyboard.press('Meta+z');
    await verifyRestored(before, 'cmd-z');

    await page.keyboard.press('Meta+Shift+z');
    assert.deepEqual(
      await snapshot(),
      imported,
      'redo restores the whole import',
    );
    await page.keyboard.type('edited ');
    await page.keyboard.press('Meta+z');
    assert.deepEqual(
      await snapshot(),
      imported,
      'undo removes a later edit first',
    );
    await page.keyboard.press('Meta+z');
    await verifyRestored(before, 'edit-then-import-undo');

    await offer();
    const beforeToast = await snapshot();
    await page
      .getByRole('button', {name: 'Import as diff', exact: true})
      .click();
    await page.getByRole('button', {name: 'Undo', exact: true}).click();
    await verifyRestored(beforeToast, 'toast-undo');
    fs.writeFileSync(
      path.join(out, 'states.json'),
      JSON.stringify({before, imported, after: await snapshot()}, null, 2),
    );
  } finally {
    await browser.close();
  }
}
main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
