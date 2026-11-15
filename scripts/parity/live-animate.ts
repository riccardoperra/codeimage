import assert from 'node:assert/strict';
import {parseArgs} from 'node:util';
import {chromium, type Page} from 'playwright';
import {mkdir} from 'node:fs/promises';

const {values: args} = parseArgs({
  options: {
    url: {type: 'string', default: 'http://localhost:4377/'},
    lane: {type: 'string', multiple: true},
    out: {type: 'string', default: '/tmp/codeimage-animate'},
  },
});
const out = args.out!;
await mkdir(out, {recursive: true});
const browser = await chromium.launch({channel: 'chrome', headless: true});
const tabs = [
  {id: 'a', tabName: 'user.ts', code: 'const greeting = "hello";'},
  {
    id: 'b',
    tabName: 'user.ts',
    code: 'const greeting = "hello";\nconsole.log(greeting);',
  },
  {
    id: 'c',
    tabName: 'user.test.ts',
    code: 'function greet(name: string) {\n  return `hello ${name}`;\n}',
  },
];
async function load(page: Page) {
  await page
    .locator('.cm-content[contenteditable="true"]')
    .first()
    .waitFor({timeout: 300000});
  const close = page.getByRole('button', {name: 'close', exact: true});
  if (await close.isVisible()) await close.click();
  await page.evaluate(async () => {
    const path = '/src/state/editor/index.ts';
    const {getEditorStore} = await import(/* @vite-ignore */ path);
    Object.assign(window, {editorStore: getEditorStore()});
  });
}
// Page evaluation uses the real store, including its context and browser clock.
type Store = ReturnType<
  (typeof import('../../apps/codeimage/src/state/editor/index'))['getEditorStore']
>;
declare const window: Window & {editorStore: Store; measuredFrames: number};
async function seed(page: Page) {
  await page.evaluate(tabs => {
    const {editor, animation} = window.editorStore;
    animation.actions.setOpen(false);
    editor.actions.setFromPersistedState({
      options: editor.stateToPersist().options,
      editors: tabs.map(tab => ({
        ...tab,
        languageId: 'typescript',
        lineNumberStart: 1,
        marks: {lines: [], focusedLines: []},
      })),
    });
    animation.actions.setFromPersistedState(undefined);
    animation.actions.setOpen(true);
  }, tabs);
}
async function preview(page: Page, atMs: number) {
  await page.evaluate(
    ms => window.editorStore.animation.actions.seek(ms),
    atMs,
  );
  await page.locator('[data-animation-stage]:visible').waitFor();
}
async function pill(page: Page) {
  await preview(page, 1600);
  await page.locator('[data-preview-pill]').click();
  assert.equal(
    await page.evaluate(() => window.editorStore.editor.state.activeEditorId),
    'b',
  );
  await preview(page, 1600);
  await page.locator('[data-animation-stage]:visible').focus();
  await page.keyboard.press('F');
  await page.waitForFunction(() =>
    window.editorStore.editor.state.editors
      .find(tab => tab.id === 'b')
      ?.code.includes('F'),
  );
  for (const key of ['Escape', 'Enter']) {
    await preview(page, 100);
    await page.locator('[data-animation-stage]:visible').focus();
    await page.keyboard.press(key);
    assert.equal(
      await page.evaluate(() => window.editorStore.animation.playback().state),
      'editing',
    );
  }
}
async function header(page: Page) {
  for (const mode of ['tab', 'tabs', 'title'] as const) {
    await page.evaluate(
      mode =>
        window.editorStore.animation.actions.setHeader({
          mode,
          title: 'A story',
        }),
      mode,
    );
    await preview(page, 100);
    const frame = page
      .locator('[data-animation-scene="0"] [data-animation-frame]')
      .first();
    if (mode === 'title')
      assert.equal(
        await frame.locator('[data-animation-title]').textContent(),
        'A story',
      );
    else {
      assert.equal(
        await frame.getByText('user.ts', {exact: true}).count(),
        mode === 'tabs' ? 2 : 1,
      );
      assert.equal(
        await frame.getByText('user.test.ts', {exact: true}).count(),
        mode === 'tabs' ? 1 : 0,
      );
    }
  }
  // A timing edit must not mount any of the hidden measuring frames.
  await page.evaluate(() => {
    window.measuredFrames = 0;
    const observer = new MutationObserver(records => {
      for (const record of records)
        for (const node of record.addedNodes)
          if (node instanceof HTMLElement && node.style.visibility === 'hidden')
            window.measuredFrames++;
    });
    observer.observe(document.body, {childList: true});
    window.editorStore.animation.actions.setTransition('b', {ms: 1100});
    setTimeout(() => observer.disconnect(), 300);
  });
  await page.waitForTimeout(350);
  assert.equal(await page.evaluate(() => window.measuredFrames), 0);
}
const lanes = {Pill: pill, Header: header};
try {
  for (const [name, run] of Object.entries(lanes)) {
    if (args.lane && !args.lane.includes(name)) continue;
    const page = await browser.newPage({viewport: {width: 1440, height: 900}});
    await page.route('**/mockServiceWorker.js', route =>
      route.fulfill({
        path: new URL(
          '../../apps/codeimage/node_modules/msw/lib/mockServiceWorker.js',
          import.meta.url,
        ).pathname,
        contentType: 'text/javascript',
      }),
    );
    page.on('pageerror', error => console.error('PAGE', error.message));
    await page.goto(`${args.url}?v=2`);
    await load(page);
    await seed(page);
    await run(page);
    console.log(`PASS ${name}`);
    await page.close();
  }
} finally {
  await browser.close();
}
