import type {getEditorStore} from '../../apps/codeimage/src/state/editor/index';
import assert from 'node:assert/strict';
import {parseArgs} from 'node:util';
import {
  chromium,
  type BrowserContext,
  type Locator,
  type Page,
} from 'playwright';
import {mkdir} from 'node:fs/promises';

const {values: args} = parseArgs({
  options: {
    url: {type: 'string', default: 'http://localhost:4377/'},
    lane: {type: 'string', multiple: true},
    out: {type: 'string', default: '/tmp/codeimage-animate'},
    video: {type: 'boolean', default: false},
    layout: {type: 'string'},
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
    path: `${out}/layout-${await page.locator('[data-layout]').first().getAttribute('data-layout')}-${page.viewportSize()!.width}.png`,
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
  const header = page.locator(
    '[data-animate-panel] button[aria-label=Header]:visible',
  );
  await header.focus();
  await page.keyboard.press('ArrowDown');
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
  assert.ok(
    await title.evaluate(element => element === document.activeElement),
  );
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
  const input = page.locator('#animationDuration-input');
  assert.equal(await input.inputValue(), '700');
  await page.keyboard.press('ArrowRight');
  assert.equal(await segment.getAttribute('aria-valuenow'), '800');
  await page.keyboard.press('Alt+ArrowLeft');
  assert.equal(await segment.getAttribute('aria-valuenow'), '790');
  assert.equal(await input.inputValue(), '790');
  assert.ok(
    await segment.evaluate(element => element === document.activeElement),
  );
  await input.click();
  await input.press('ControlOrMeta+A');
  await input.pressSequentially('1350');
  assert.equal(await segment.getAttribute('aria-valuenow'), '790');
  await input.press('Enter');
  assert.equal(await segment.getAttribute('aria-valuenow'), '1350');
  assert.ok(
    await input.evaluate(element => element === document.activeElement),
  );
  await input.click();
  await input.press('Escape');
  assert.ok(
    await segment.evaluate(element => element === document.activeElement),
    'Esc in the details row returns focus to the segment',
  );
  assert.equal(
    await page.evaluate(() => window.editorStore.animation.selection()),
    null,
  );
}

async function fullyVisible(locator: Locator) {
  assert.ok(
    await locator.evaluate(element => {
      const box = element.getBoundingClientRect();
      const dialog = element
        .closest('[role="dialog"]')!
        .getBoundingClientRect();
      const inside =
        box.width > 0 &&
        box.height > 0 &&
        box.left >= Math.max(0, dialog.left) &&
        box.top >= Math.max(0, dialog.top) &&
        box.right <= Math.min(innerWidth, dialog.right) &&
        box.bottom <= Math.min(innerHeight, dialog.bottom);
      const x = (box.left + box.right) / 2;
      const y = (box.top + box.bottom) / 2;
      return (
        inside &&
        [
          [box.left + 2, y],
          [box.right - 2, y],
          [x, box.top + 2],
          [x, box.bottom - 2],
          [x, y],
        ].every(([x, y]) => element.contains(document.elementFromPoint(x, y)))
      );
    }),
    `${(await locator.getAttribute('aria-label')) ?? (await locator.textContent())} is inside the visible popover and hit-testable`,
  );
}

async function easing(page: Page) {
  const segment = page.locator('[data-animation-segment]').nth(1);
  await segment.click();
  const trigger = page.locator('[data-easing-trigger]');
  await trigger.click();
  await fullyVisible(
    page.getByRole('img', {name: 'Easing curve', exact: true}),
  );
  await fullyVisible(
    page.getByRole('button', {name: 'Play transition', exact: true}),
  );
  await page.getByRole('tab', {name: 'Strong', exact: true}).click();
  assert.equal(
    await page.evaluate(
      () => window.editorStore.animation.settings().steps[1].transition?.easing,
    ),
    'strong',
  );
  await page.getByRole('tab', {name: 'Custom', exact: true}).click();
  const input = page.getByRole('textbox', {name: 'Custom', exact: true});
  await fullyVisible(input);
  await fullyVisible(
    page.getByRole('img', {name: 'Easing curve', exact: true}),
  );
  await fullyVisible(
    page.getByRole('button', {name: 'Play transition', exact: true}),
  );
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
  await fullyVisible(
    page.getByText('Use four numbers with x between 0 and 1.', {exact: true}),
  );
  await fullyVisible(
    page.getByRole('button', {name: 'Play transition', exact: true}),
  );
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
  await page.keyboard.press('Escape');
  await page
    .getByRole('dialog', {name: 'Easing', exact: true})
    .waitFor({state: 'hidden'});
  await trigger.focus();
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

async function removeDuringPreview(page: Page) {
  for (const playing of [false, true])
    for (let index = 0; index < 3; index++) {
      await seed(page);
      const holds = page.locator('[data-animation-segment][data-kind="hold"]');
      const removed = await holds.nth(index).getAttribute('data-step-id');
      await holds.nth(index).click();
      if (playing)
        await page
          .getByRole('button', {name: 'Play animation', exact: true})
          .click();
      else
        await page
          .getByRole('slider', {name: 'Playhead', exact: true})
          .click({position: {x: 25, y: 18}});
      await page.locator('[data-animation-stage]:visible').waitFor();
      await page.getByRole('button', {name: 'Steps', exact: true}).click();
      await page
        .getByRole('menuitem', {name: 'Remove step', exact: true})
        .click();
      await page.getByRole('menu').waitFor({state: 'hidden'});
      assert.equal(await holds.count(), 2);
      assert.equal(
        await page
          .locator(`[data-animation-segment][data-step-id="${removed}"]`)
          .count(),
        0,
      );
      await page.locator('[data-animation-stage]:visible').waitFor();
      await page.waitForFunction(async removed => {
        const db = await new Promise<IDBDatabase>(resolve => {
          const request = indexedDB.open('keyval-store');
          request.onsuccess = () => resolve(request.result);
        });
        try {
          const saved = await new Promise<{
            animation?: {steps: {id: string}[]};
          }>(resolve => {
            const request = db
              .transaction('keyval')
              .objectStore('keyval')
              .get('document');
            request.onsuccess = () => resolve(request.result);
          });
          return (
            saved?.animation?.steps.length === 2 &&
            saved.animation.steps.every(step => step.id !== removed)
          );
        } finally {
          db.close();
        }
      }, removed);
      await page.getByRole('button', {name: 'Steps', exact: true}).click();
      for (const name of [
        'Duplicate as next step',
        'Move earlier',
        'Move later',
        'Remove step',
      ])
        assert.equal(
          await page
            .getByRole('menuitem', {name, exact: true})
            .getAttribute('aria-disabled'),
          'true',
        );
      await page.keyboard.press('Escape');
    }
}

async function keyboardDetails(page: Page) {
  const holds = page.locator('[data-animation-segment]');
  await holds.first().focus();
  await page.keyboard.press('ArrowDown');
  const transition = holds.nth(1);
  assert.ok(
    await transition.evaluate(element => element === document.activeElement),
  );
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('Tab');
  const input = page.locator('#animationDuration-input');
  assert.ok(
    await input.evaluate(element => element === document.activeElement),
  );
  assert.equal(await input.inputValue(), '800');
  const easing = page.locator('[data-easing-trigger]');
  for (
    let i = 0;
    i < 4 &&
    !(await easing.evaluate(element => element === document.activeElement));
    i++
  )
    await page.keyboard.press('Tab');
  assert.ok(
    await easing.evaluate(element => element === document.activeElement),
  );
  await page.keyboard.press('Tab');
  assert.ok(
    await page
      .getByRole('button', {name: 'Apply to all', exact: true})
      .evaluate(element => element === document.activeElement),
  );
}

async function playFocus(page: Page) {
  for (const command of [false, true]) {
    await seed(page);
    if (command) {
      await page.keyboard.press('ControlOrMeta+k');
      await page.getByRole('combobox').fill('Play or pause the animation');
      await page.keyboard.press('Enter');
    } else
      await page
        .getByRole('button', {name: 'Play animation', exact: true})
        .click();
    const stage = page.locator('[data-animation-stage]:visible');
    await stage.waitFor();
    await page.waitForFunction(() =>
      document.activeElement?.hasAttribute('data-animation-stage'),
    );
    await page.keyboard.press('b');
    await page.waitForFunction(
      () => window.editorStore.animation.playback().state === 'editing',
    );
    assert.ok(
      await page
        .locator('.cm-content[contenteditable="true"]')
        .first()
        .evaluate(element => element === document.activeElement),
    );
    assert.ok(
      await page
        .locator('.cm-content[contenteditable="true"]')
        .first()
        .innerText()
        .then(text => text.includes('b')),
    );
  }
}

async function customBlur(page: Page) {
  await page.locator('[data-animation-segment]').nth(1).click();
  await page.locator('[data-easing-trigger]').click();
  await page.getByRole('tab', {name: 'Custom', exact: true}).click();
  const input = page.getByRole('textbox', {name: 'Custom', exact: true});
  await input.fill('cubic-bezier(0.3, 0.2, 0.7, 0.8)');
  await input.press('Tab');
  assert.equal(
    await page.evaluate(
      () => window.editorStore.animation.settings().steps[1].transition?.easing,
    ),
    'cubic-bezier(0.3, 0.2, 0.7, 0.8)',
  );
  await input.fill('cubic-bezier(0, 0, 1, 1)');
  await input.press('Enter');
  assert.ok(
    await input.evaluate(element => element === document.activeElement),
  );
  await input.press('Escape');
}

async function overflow(page: Page) {
  // Repeated tabs are legitimate steps; setup a long document, then use its controls.
  await page.evaluate(() => {
    for (let i = 0; i < 37; i++)
      window.editorStore.animation.actions.addStep('a');
  });
  const track = page.locator('[data-animation-track]');
  const scroller = track.locator('../..');
  assert.ok(
    await scroller.evaluate(
      element => element.scrollWidth > element.clientWidth,
    ),
  );
  await page.locator('[data-animation-segment]').last().focus();
  assert.ok(await scroller.evaluate(element => element.scrollLeft > 0));
  const before = Number(
    await page
      .locator('[data-animation-segment]')
      .last()
      .getAttribute('aria-valuenow'),
  );
  await page.keyboard.press('ArrowRight');
  assert.equal(
    Number(await page.locator('#animationDuration-input').inputValue()),
    before + 100,
  );
  const boxes = await track.evaluate(element => {
    const track = element.getBoundingClientRect();
    const ruler = element.previousElementSibling!.getBoundingClientRect();
    const last = element.lastElementChild!.getBoundingClientRect();
    return {
      track: {left: track.left, right: track.right},
      ruler: {left: ruler.left, right: ruler.right},
      last: last.right,
    };
  });
  assert.equal(boxes.track.left, boxes.ruler.left);
  assert.equal(boxes.track.right, boxes.ruler.right);
  assert.ok(Math.abs(boxes.last - boxes.track.right) < 1);
  await page
    .getByRole('slider', {name: 'Playhead', exact: true})
    .click({position: {x: boxes.track.right - boxes.track.left - 10, y: 18}});
  assert.ok(
    await page.evaluate(
      () =>
        window.editorStore.animation.playhead() >
        window.editorStore.animation.durationMs() * 0.95,
    ),
  );
}
async function controls(page: Page) {
  await page.keyboard.press('ControlOrMeta+k');
  await page.getByRole('combobox').fill('Animate');
  await page.getByRole('option', {name: 'Animate', exact: true}).click();
  await page.waitForFunction(() =>
    document.activeElement?.hasAttribute('data-animate-toggle'),
  );
  await page.keyboard.press('ControlOrMeta+k');
  await page.getByRole('combobox').fill('Animate');
  await page.getByRole('option', {name: 'Animate', exact: true}).click();
  await page.waitForFunction(() =>
    document
      .querySelector('[data-animate-panel]')
      ?.contains(document.activeElement),
  );
  await page.locator('[data-animation-segment]').nth(1).click();
  if (page.viewportSize()!.width < 768) {
    for (const control of [
      page.getByRole('button', {name: 'Steps', exact: true}),
      page.locator('[data-animate-panel] button[aria-label=Header]:visible'),
      page.locator('[data-easing-trigger]'),
      page.getByRole('button', {name: 'Apply to all', exact: true}),
    ])
      assert.ok((await control.boundingBox())!.height >= 40);
  }
  await page.locator('[data-settings-trigger]').click();
  await page.locator('[data-settings-section="export"]').click();
  const png = page
    .locator('[data-setting=export-format]')
    .getByRole('tab', {name: 'PNG', exact: true});
  await png.focus();
  await page.keyboard.press('Escape');
  assert.ok(
    await page.locator('[data-settings-section=general]').isVisible(),
    'Escape on ordinary segmented controls retains the Settings dialog',
  );
  await page.getByRole('button', {name: 'Close', exact: true}).click();
}
const lanes = {
  Controls: controls,
  RemoveDuringPreview: removeDuringPreview,
  KeyboardDetails: keyboardDetails,
  PlayFocus: playFocus,
  CustomBlur: customBlur,
  Overflow: overflow,
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
type Layout = 'inspector' | 'dock' | 'studio';
const layouts: Layout[] = ['inspector', 'dock', 'studio'];
// The page reads its layout only from the saved preference.
async function openEditor(context: BrowserContext, layout: Layout) {
  await context.addInitScript(layout => {
    const key = 'codeimage:editor-settings';
    const stored = JSON.parse(localStorage.getItem(key) ?? '{}');
    localStorage.setItem(key, JSON.stringify({...stored, layout}));
  }, layout);
  const page = await context.newPage();
  await page.goto(args.url!, {waitUntil: 'domcontentloaded'});
  return page;
}
async function recordLayout(layout: Layout) {
  const context = await browser.newContext({
    viewport: {width: 1440, height: 900},
    recordVideo: {dir: `${out}/videos`, size: {width: 1440, height: 900}},
  });
  const page = await openEditor(context, layout);
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
  for (const layout of layouts.filter(
    layout => !args.layout || layout === args.layout,
  ))
    for (const viewport of [
      {width: 1440, height: 900},
      {width: 390, height: 844},
    ]) {
      const context = await browser.newContext({viewport});
      const page = await openEditor(context, layout);
      page.setDefaultTimeout(10000);
      page.setDefaultNavigationTimeout(120000);
      const errors: string[] = [];
      page.on('pageerror', error => errors.push(error.stack ?? error.message));
      page.on('console', message => {
        if (message.text().includes('Cannot remove nonexistent'))
          errors.push(message.text());
      });
      try {
        await load(page);
        for (const [name, run] of Object.entries(lanes)) {
          if (args.lane && !args.lane.includes(name)) continue;
          const label = `${name} ${layout} ${viewport.width}`;
          try {
            errors.length = 0;
            await seed(page);
            await run(page);
            assert.deepEqual(errors, [], 'no uncaught browser errors');
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
  if (args.video) for (const layout of layouts) await recordLayout(layout);
} finally {
  await browser.close();
}
console.log(
  `${passed} passed, ${failures.length} failed; Chrome only (Firefox/WebKit skipped)`,
);
if (failures.length) process.exitCode = 1;
