import type {getEditorStore} from '../../apps/codeimage/src/state/editor/index';
import assert from 'node:assert/strict';
import {parseArgs} from 'node:util';
import {chromium, type Page} from 'playwright';
import {mkdir} from 'node:fs/promises';

const {values: args} = parseArgs({
  options: {
    url: {type: 'string', default: 'http://localhost:4377/'},
    lane: {type: 'string', multiple: true},
    out: {type: 'string', default: '/tmp/codeimage-animate'},
    video: {type: 'boolean', default: false},
    variant: {type: 'string'},
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
    .waitFor({timeout: 60000});
  const close = page.getByRole('button', {name: 'close', exact: true});
  if (await close.isVisible()) await close.click();
  // The What's new nudge appears once the page settles and covers Dock's
  // phone bar, so a lane would click it instead of the control under it.
  await page.addStyleTag({content: '[data-whats-new]{display:none!important}'});
  await page.evaluate(async () => {
    const path = '/src/state/editor/index.ts';
    const {getEditorStore} = await import(/* @vite-ignore */ path);
    Object.assign(window, {editorStore: getEditorStore()});
  });
}
// Page evaluation uses the real store, including its context and browser clock.
type Store = ReturnType<typeof getEditorStore>;
declare const window: Window & {
  editorStore: Store;
  measuredFrames: number;
  saves: number;
  writes: number;
};
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
      `${key} returns to editing`,
    );
  }
}
async function header(page: Page) {
  for (const type of ['macOs', 'windows', 'card', 'editor', 'shell']) {
    await page.evaluate(
      type => window.editorStore.terminal.setType(type),
      type,
    );
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
  }
  await page.evaluate(() => window.editorStore.terminal.setType('macOs'));
  await page.evaluate(() =>
    window.editorStore.animation.actions.setHeader({mode: 'tab'}),
  );
  await preview(page, 100);
  // Compare at a common pixel origin, independently of frame centering and zoom.
  const headerPixels = async (scene: number) => {
    await page
      .locator(`[data-animation-scene="${scene}"] [data-header-visible=true]`)
      .first()
      .evaluate(element => {
        const clone = element.cloneNode(true) as HTMLElement;
        const computed = getComputedStyle(element);
        for (const name of computed)
          if (name.startsWith('--'))
            clone.style.setProperty(name, computed.getPropertyValue(name));
        Object.assign(clone.style, {
          position: 'fixed',
          left: '0',
          top: '0',
          width: `${element.clientWidth}px`,
          fontFamily: computed.fontFamily,
          fontSize: computed.fontSize,
          lineHeight: computed.lineHeight,
          zIndex: '2147483647',
        });
        clone.setAttribute('data-header-parity', '');
        document.body.append(clone);
      });
    const png = await page
      .locator('[data-header-parity] > div')
      .first()
      .screenshot();
    await page
      .locator('[data-header-parity]')
      .evaluate(element => element.remove());
    return png;
  };
  const beforeHeader = await headerPixels(0);
  await preview(page, 1600);
  const afterHeader = await headerPixels(3);
  assert.equal(
    beforeHeader.equals(afterHeader),
    true,
    'same-name steps keep identical header pixels',
  );
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

async function placement(page: Page) {
  await page.evaluate(() =>
    window.editorStore.animation.actions.setOpen(false),
  );
  const toggle = page.locator('[data-animate-toggle]:visible');
  await toggle.click();
  assert.equal(await toggle.getAttribute('aria-pressed'), 'true');
  assert.ok(
    await toggle.evaluate(element => element === document.activeElement),
  );
  const island = page.locator('[data-animate-panel]');
  await island.waitFor();
  await page.waitForTimeout(250);
  const box = await island.boundingBox();
  const frame = await page
    .locator('[data-fit-scale] > div > div')
    .last()
    .boundingBox();
  assert.ok(
    box && box.x >= 0 && box.x + box.width <= page.viewportSize()!.width + 1,
  );
  const code = await page
    .locator('.cm-content[contenteditable="true"]')
    .first()
    .boundingBox();
  assert.ok(
    code && box && code.y + code.height <= box.y + 2,
    `frame above island: ${JSON.stringify({code, box, frame})}`,
  );
  await page.screenshot({
    path: `${out}/layout-${new URL(page.url()).searchParams.get('v')}-${page.viewportSize()!.width}.png`,
  });
  await toggle.click();
  assert.equal(await island.count(), 0);
  await toggle.click();
}
async function playback(page: Page) {
  const panel = page.locator('[data-animate-panel]');
  await panel
    .getByRole('button', {name: 'Play animation', exact: true})
    .click();
  await page.waitForFunction(() => window.editorStore.animation.playhead() > 0);
  await panel
    .getByRole('button', {name: 'Pause animation', exact: true})
    .click();
  assert.equal(
    await page.evaluate(() => window.editorStore.animation.playback().state),
    'paused',
  );
  const stage = page.locator('[data-animation-stage]:visible');
  await stage.focus();
  await page.keyboard.press('Space');
  assert.equal(
    await page.evaluate(() => window.editorStore.animation.playback().state),
    'playing',
  );
  await panel.getByRole('button', {name: 'Stop and edit the code'}).click();
  assert.equal(
    await page.evaluate(() => window.editorStore.animation.playback().state),
    'editing',
  );
  assert.ok(
    await page
      .locator('.cm-content[contenteditable="true"]')
      .evaluate(element => element === document.activeElement),
  );
}
async function scrub(page: Page) {
  const ruler = page.getByRole('slider', {name: 'Playhead', exact: true});
  const box = (await ruler.boundingBox())!;
  await page.mouse.move(box.x + box.width * 0.25, box.y + 12);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.6, box.y + 12);
  await page.mouse.up();
  const at = await page.evaluate(() => window.editorStore.animation.playhead());
  await page.waitForTimeout(100);
  assert.equal(
    await page.evaluate(() => window.editorStore.animation.playhead()),
    at,
  );
  await page.locator('[data-animation-segment]').first().click();
  assert.equal(
    await page.evaluate(() => window.editorStore.animation.playhead()),
    at,
  );
  assert.equal(
    await page.locator('[data-animation-segment][data-selected]').count(),
    1,
  );
}
async function steps(page: Page) {
  const menu = page.getByRole('button', {name: 'Steps', exact: true});
  await menu.click();
  await page
    .getByRole('menuitem', {name: 'Add to animation', exact: true})
    .hover();
  await page.getByRole('menuitem', {name: 'user.test.ts', exact: true}).click();
  assert.equal(
    await page.evaluate(
      () => window.editorStore.animation.settings().steps.at(-1)?.editorId,
    ),
    'c',
  );
  await menu.click();
  await page
    .getByRole('menuitem', {name: 'Duplicate as next step', exact: true})
    .click();
  assert.equal(
    await page.evaluate(() => window.editorStore.editor.state.editors.length),
    4,
  );
  assert.equal(
    await page.evaluate(
      () => window.editorStore.animation.settings().steps.length,
    ),
    5,
  );
  await page.evaluate(() => {
    const {animation, editor} = window.editorStore;
    animation.actions.addStep('a');
    const id = animation.settings().steps.at(-1)!.id;
    animation.actions.moveStep(id, -1);
    animation.actions.removeStep(id);
    editor.actions.addEditor({}, false);
  });
  assert.equal(
    await page.evaluate(
      () => window.editorStore.animation.settings().steps.length,
    ),
    5,
  );
  await page.evaluate(() =>
    window.editorStore.editor.actions.removeEditor('c'),
  );
  await page.waitForFunction(() =>
    window.editorStore.animation
      .settings()
      .steps.every(step => step.editorId !== 'c'),
  );
}
async function persistence(page: Page) {
  await page.evaluate(() => {
    const {animation} = window.editorStore;
    animation.actions.setTransition('b', {
      ms: 1234,
      easing: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
    });
    animation.actions.setHeader({mode: 'title', title: 'Saved story'});
    animation.actions.addStep('a');
  });
  const before = await page.evaluate(() =>
    window.editorStore.animation.stateToPersist(),
  );
  await page.waitForTimeout(700);
  await page.reload();
  await load(page);
  assert.deepEqual(
    await page.evaluate(() => window.editorStore.animation.stateToPersist()),
    before,
  );
  assert.equal(
    await page.evaluate(() => window.editorStore.animation.open()),
    false,
  );
}
async function hotkeys(page: Page) {
  await page
    .locator('[data-animate-panel] button[aria-label=Header]:visible')
    .click();
  await page.getByRole('option', {name: 'Title only', exact: true}).click();
  const title = page.getByRole('textbox', {name: 'Title', exact: true});
  const before = await page.evaluate(() => [
    window.editorStore.frame.store.padding,
    window.editorStore.frame.store.visible,
    window.editorStore.terminal.state.showHeader,
  ]);
  await title.click();
  await title.pressSequentially('FPBDHW');
  await title.press('Enter');
  assert.deepEqual(
    await page.evaluate(() => [
      window.editorStore.frame.store.padding,
      window.editorStore.frame.store.visible,
      window.editorStore.terminal.state.showHeader,
    ]),
    before,
  );
  assert.equal(
    await page.evaluate(
      () => window.editorStore.animation.settings().header.title,
    ),
    'FPBDHW',
  );
  await title.focus();
  await title.press('Escape');
  assert.ok(
    await page
      .locator('.cm-content[contenteditable=true]')
      .evaluate(element => element === document.activeElement),
  );
  for (const key of ['F', 'P', 'B', 'D', 'H', 'W']) {
    await preview(page, 1600);
    await page.locator('[data-animation-stage]:visible').focus();
    await page.keyboard.press(key);
    await page.waitForFunction(
      key =>
        window.editorStore.editor.state.editors
          .find(tab => tab.id === 'b')
          ?.code.includes(key),
      key,
    );
  }
  assert.deepEqual(
    await page.evaluate(() => [
      window.editorStore.frame.store.padding,
      window.editorStore.frame.store.visible,
      window.editorStore.terminal.state.showHeader,
    ]),
    before,
  );
}

async function resize(page: Page) {
  await page.waitForTimeout(300);
  await page.evaluate(() => {
    window.saves = 0;
    window.writes = 0;
    window.editorStore.animation.stateToPersist$.subscribe(
      () => window.saves++,
    );
    const put = IDBObjectStore.prototype.put;
    IDBObjectStore.prototype.put = function (...args) {
      window.writes++;
      return put.apply(this, args);
    };
  });
  const track = page.locator('[data-animation-track]');
  const first = page.locator('[data-animation-segment]').first();
  const initial = await first.boundingBox();
  const next = page.locator('[data-animation-segment]').nth(1);
  const nextInitial = (await next.boundingBox())!;
  const axis = Number(await track.getAttribute('data-axis-ms'));
  const usable = (await track.boundingBox())!.width - 12;
  const handle = first.locator('[data-segment-resize]');
  const box = (await handle.boundingBox())!;
  await page.mouse.move(box.x + 4, box.y + 12);
  await page.mouse.down();
  await page.mouse.move(box.x + 4 + (usable * 400) / axis, box.y + 12, {
    steps: 5,
  });
  assert.equal(Number(await track.getAttribute('data-axis-ms')), axis);
  assert.equal(await first.getAttribute('aria-valuenow'), '1200');
  const current = (await first.boundingBox())!;
  assert.ok(
    Math.abs(current.width - initial!.width - (usable * 400) / axis) < 1,
  );
  assert.ok(
    Math.abs(
      (await next.boundingBox())!.x - nextInitial.x - (usable * 400) / axis,
    ) < 1,
  );
  assert.equal(await page.evaluate(() => window.saves), 0);
  await page.mouse.up();
  await page.waitForTimeout(300);
  assert.equal(await page.evaluate(() => window.saves), 1);
  assert.equal(await page.evaluate(() => window.writes), 1);
  assert.equal(Number(await track.getAttribute('data-axis-ms')), axis + 400);
  // A second drag uses 10 ms snapping with Alt.
  const secondBox = (await handle.boundingBox())!;
  const total = axis + 400;
  await page.keyboard.down('Alt');
  await page.mouse.move(secondBox.x + 4, secondBox.y + 12);
  await page.mouse.down();
  await page.mouse.move(
    secondBox.x + 4 + (usable * 30) / total,
    secondBox.y + 12,
  );
  await page.mouse.up();
  await page.keyboard.up('Alt');
  assert.equal(await first.getAttribute('aria-valuenow'), '1230');
}
async function nudge(page: Page) {
  const segment = page.locator('[data-animation-segment]').nth(1);
  await segment.focus();
  await page.keyboard.press('ArrowRight');
  assert.equal(await segment.getAttribute('aria-valuenow'), '800');
  await page.keyboard.press('Alt+ArrowLeft');
  assert.equal(await segment.getAttribute('aria-valuenow'), '790');
  assert.ok(
    await segment.evaluate(element => element === document.activeElement),
  );
  const input = page.locator('#animationDuration-input');
  await input.click();
  await input.press('ControlOrMeta+A');
  await input.pressSequentially('1350');
  assert.equal(await segment.getAttribute('aria-valuenow'), '790');
  await input.press('Enter');
  assert.equal(await segment.getAttribute('aria-valuenow'), '1350');
}

async function easing(page: Page) {
  const segment = page.locator('[data-animation-segment]').nth(1);
  await segment.click();
  const trigger = page.locator('[data-easing-trigger]');
  await trigger.click();
  await page.getByRole('tab', {name: 'Strong', exact: true}).click();
  assert.equal(
    await page.evaluate(
      () => window.editorStore.animation.settings().steps[1].transition?.easing,
    ),
    'strong',
  );
  await page.getByRole('tab', {name: 'Custom', exact: true}).click();
  const input = page.getByRole('textbox', {name: 'Custom', exact: true});
  await input.fill('cubic-bezier(0.25, -2, 0.3, 8)');
  await input.press('Enter');
  assert.equal(
    await page.evaluate(
      () => window.editorStore.animation.settings().steps[1].transition?.easing,
    ),
    'cubic-bezier(0.25, 0, 0.3, 1)',
  );
  await input.fill('cubic-bezier(-1, 0, 1, 1)');
  await input.press('Enter');
  assert.equal(await input.getAttribute('aria-invalid'), 'true');
  assert.equal(
    await page.evaluate(
      () => window.editorStore.animation.settings().steps[1].transition?.easing,
    ),
    'cubic-bezier(0.25, 0, 0.3, 1)',
  );
  await page.evaluate(() => window.editorStore.animation.actions.seek(1150));
  await page.locator('[data-easing-dot]').waitFor();
  assert.ok(
    Number(await page.locator('[data-easing-dot]').getAttribute('cy')) > 10,
  );
  await page
    .getByRole('button', {name: 'Play transition', exact: true})
    .click();
  await page.waitForFunction(
    () => window.editorStore.animation.playback().state === 'paused',
  );
  assert.equal(
    await page.evaluate(() => window.editorStore.animation.playhead()),
    1500,
  );
  await input.press('Escape');
  await page.waitForFunction(() =>
    document.activeElement?.hasAttribute('data-easing-trigger'),
  );
  await trigger.click();
  await page.getByRole('tab', {name: 'Strong', exact: true}).focus();
  await page.keyboard.press('Escape');
  await page.waitForFunction(() =>
    document.activeElement?.hasAttribute('data-easing-trigger'),
  );
  await page.getByRole('button', {name: 'Apply to all', exact: true}).click();
  assert.ok(
    await page
      .getByRole('button', {name: 'Apply to all', exact: true})
      .isDisabled(),
  );
  assert.equal(
    await page.evaluate(() => window.editorStore.animation.settings().easing),
    'cubic-bezier(0.25, 0, 0.3, 1)',
  );
}
const lanes = {
  Easing: easing,
  Resize: resize,
  Nudge: nudge,
  Placement: placement,
  Playback: playback,
  Scrub: scrub,
  Steps: steps,
  Persistence: persistence,
  Hotkeys: hotkeys,
  Pill: pill,
  Header: header,
};
async function recordLayout(layout: number) {
  const context = await browser.newContext({
    viewport: {width: 1440, height: 900},
    recordVideo: {dir: `${out}/videos`, size: {width: 1440, height: 900}},
  });
  const page = await context.newPage();
  await page.goto(`${args.url}?v=${layout}`, {waitUntil: 'domcontentloaded'});
  await load(page);
  await seed(page);
  await page.getByRole('button', {name: 'Play animation', exact: true}).click();
  await page.waitForTimeout(1800);
  await page
    .getByRole('button', {name: 'Pause animation', exact: true})
    .click();
  await page.locator('[data-animation-segment]').nth(1).click();
  await page.locator('[data-easing-trigger]').click();
  await page.getByRole('tab', {name: 'Strong', exact: true}).click();
  await page.waitForTimeout(600);
  await page.keyboard.press('Escape');
  await page.locator('[data-preview-pill]').click();
  await page.waitForTimeout(600);
  const video = page.video()!;
  await context.close();
  await video.saveAs(`${out}/layout-${layout}.webm`);
}
let passed = 0;
const failures: string[] = [];
try {
  for (const layout of [2, 3, 4].filter(
    layout => !args.variant || layout === Number(args.variant),
  ))
    for (const viewport of [
      {width: 1440, height: 900},
      {width: 390, height: 844},
    ]) {
      const context = await browser.newContext({viewport});
      const page = await context.newPage();
      page.setDefaultTimeout(10000);
      page.setDefaultNavigationTimeout(120000);
      page.on('pageerror', error =>
        console.error(`PAGE ${layout}`, error.message),
      );
      try {
        await page.goto(`${args.url}?v=${layout}`, {
          waitUntil: 'domcontentloaded',
        });
        await load(page);
        for (const [name, run] of Object.entries(lanes)) {
          if (args.lane && !args.lane.includes(name)) continue;
          const label = `${name} v${layout} ${viewport.width}`;
          try {
            await seed(page);
            await run(page);
            console.log(`PASS ${label}`);
            passed++;
          } catch (error) {
            failures.push(label);
            console.error(`FAIL ${label}`, String(error).slice(0, 2000));
            await page.screenshot({
              path: `${out}/failure-${name}-${layout}-${viewport.width}.png`,
            });
          }
        }
      } finally {
        const video = page.video();
        await context.close();
        if (video) await video.saveAs(`${out}/layout-${layout}.webm`);
      }
    }
  if (args.video) for (const layout of [2, 3, 4]) await recordLayout(layout);
} finally {
  await browser.close();
}
console.log(
  `${passed} passed, ${failures.length} failed; Chrome only (Firefox/WebKit skipped)`,
);
if (failures.length) process.exitCode = 1;
