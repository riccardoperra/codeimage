import {chromium} from 'playwright';

const url = process.argv[2] ?? 'http://localhost:4377/';
const out = process.argv[3] ?? 'docs/prototypes/animate';
const worker =
  'node_modules/.pnpm/msw@2.12.14_@types+node@25.9.9_typescript@6.0.3/node_modules/msw/lib/mockServiceWorker.js';

const browser = await chromium.launch({channel: 'chrome'});
const context = await browser.newContext({
  viewport: {width: 1440, height: 900},
});
await context.route('**/mockServiceWorker.js', route =>
  route.fulfill({path: worker, contentType: 'text/javascript'}),
);
const page = await context.newPage();
page.on(
  'console',
  m => m.type() === 'error' && console.log('console:', m.text()),
);
page.on('pageerror', e => console.log('pageerror:', e.message));
await page.goto(new URL('prototypes/editor-controls?v=2', url).href);
await page
  .locator('.cm-content[contenteditable]')
  .first()
  .waitFor({timeout: 300_000});
await page.evaluate(async () => {
  const {getEditorStore} = await import(
    /* @vite-ignore */ '/src/state/editor/index.ts'
  );
  const {editor} = getEditorStore();
  editor.actions.setFromPersistedState({
    options: {},
    editors: [
      {
        id: 'a',
        tabName: 'counter.ts',
        code: 'const count = signal(0);\n\nexport function increment() {\n  count.set(count() + 1);\n}',
      },
      {
        id: 'b',
        tabName: 'counter.ts',
        code: 'const count = signal(0);\nconst double = computed(() => count() * 2);\n\nexport function increment() {\n  count.update(n => n + 1);\n}',
      },
    ].map(t => ({
      ...t,
      languageId: 'typescript',
      lineNumberStart: 1,
      marks: {lines: [], focusedLines: []},
    })),
  });
});
await page.waitForTimeout(800);
const dialog = page.getByRole('dialog');
if (await dialog.isVisible()) {
  await page.keyboard.press('Escape');
  await dialog.waitFor({state: 'hidden'});
}
await page.screenshot({
  path: '/private/tmp/claude-501/-Users-riccardoperra--t3-worktrees-codeimage-t3-dc381b1f-ce683d29fe3d2ebc/f2bbff70-ea53-4c1b-9a9d-cd73398a104a/scratchpad/dbg.png',
});
await page
  .getByRole('button', {name: 'Animate', exact: true})
  .click({timeout: 5000});
await page.waitForTimeout(300);
await page.screenshot({path: `${out}/a3-in-new-ui-edit.png`});
await page.getByRole('button', {name: 'Play animation', exact: true}).click();
await page.waitForTimeout(1250);
await page.screenshot({path: `${out}/a3-in-new-ui-playing.png`});
await browser.close();
