import assert from 'node:assert/strict';
import {parseArgs} from 'node:util';
import type {Page} from 'playwright';
import {chromium} from 'playwright';

// Drives the Animate panel and its preview in Chrome and asserts what a user
// sees. Needs the web app on --url with the mock API, as `pnpm dev` starts it.
const {values: args} = parseArgs({
  options: {
    url: {type: 'string', default: 'http://localhost:4200/'},
    worker: {type: 'string'},
    lane: {type: 'string', multiple: true},
  },
});

type Tab = {id: string; tabName: string; code: string};
// The part of the app's editor store the lanes read in the page.
type EditorStore = {
  animation: {
    playback(): {state: string; atMs?: number};
    playhead(): number;
    durationMs(): number;
    open(): boolean;
    settings(): {
      steps: {editorId: string; holdMs: number}[];
      transitionMs: number;
      easing: string;
      fps: number;
    };
    actions: {
      edit(): void;
      seek(ms: number): void;
      setOpen(open: boolean): void;
    };
  };
  editor: {
    state: {editors: {id: string; code: string}[]};
    actions: {
      setFromPersistedState(state: unknown): void;
      removeEditor(id: string): void;
    };
  };
  frame: {store: {padding: number; visible: boolean}};
};
declare const window: Window & {editorStore: EditorStore};

const TABS: Tab[] = [
  {id: 'a', tabName: 'a.ts', code: "const greeting = 'hello';"},
  {
    id: 'b',
    tabName: 'b.ts',
    code: "const greeting = 'hello';\nconsole.log(greeting);",
  },
  {
    id: 'c',
    tabName: 'c.ts',
    code: 'function greet(name: string) {\n  return `hello ${name}`;\n}',
  },
];

const STAGE = '[data-animation-stage]';

async function loadStore(page: Page) {
  await page
    .locator('.cm-content[contenteditable]')
    .first()
    .waitFor({timeout: 300_000});
  await page.evaluate(async () => {
    // The module the app loaded, so the page shares its stores.
    const editorState = '/src/state/editor/index.ts';
    const {getEditorStore} = await import(/* @vite-ignore */ editorState);
    Object.assign(window, {editorStore: getEditorStore()});
  });
}

async function setTabs(page: Page, tabs: Tab[]) {
  await page.evaluate(tabs => {
    const {animation, editor} = window.editorStore;
    animation.actions.setOpen(false);
    editor.actions.setFromPersistedState({
      options: {},
      editors: tabs.map(tab => ({
        ...tab,
        languageId: 'typescript',
        lineNumberStart: 1,
        marks: {lines: [], focusedLines: []},
      })),
    });
  }, tabs);
  await page.waitForTimeout(500);
}

const read = (page: Page) =>
  page.evaluate(() => {
    const {animation, editor, frame} = window.editorStore;
    return {
      playback: animation.playback(),
      playhead: animation.playhead(),
      durationMs: animation.durationMs(),
      settings: animation.settings(),
      codes: editor.state.editors.map(tab => tab.code),
      padding: frame.store.padding,
    };
  });

const button = (page: Page, name: string | RegExp) =>
  page.getByRole('button', {name, exact: true});
const openPanel = (page: Page) => button(page, 'Animate').click();
const play = (page: Page) => button(page, 'Play animation').click();
const stageShown = (page: Page) =>
  page.locator(STAGE).waitFor({state: 'visible', timeout: 10_000});

// Pauses the preview at `ms` and focuses the stage.
async function focusStageAt(page: Page, ms: number) {
  await page.evaluate(ms => window.editorStore.animation.actions.seek(ms), ms);
  await stageShown(page);
  await page.locator(STAGE).focus();
}

// A project in the mock API, opened without a page load so the editor and
// its stores stay mounted.
async function openProject(
  page: Page,
  project: {tabs: Tab[]; isOwner?: boolean; animation?: unknown},
) {
  const id = await page.evaluate(async ({tabs, isOwner, animation}) => {
    const mocks = '/src/mocks/db.ts';
    const {db} = await import(/* @vite-ignore */ mocks);
    const now = new Date().toISOString();
    const {id} = db.project.create({
      id: crypto.randomUUID(),
      name: 'lane',
      ownerId: 'default-user',
      isOwner: isOwner ?? true,
      createdAt: now,
      updatedAt: now,
      editorOptions: {
        id: crypto.randomUUID(),
        fontId: 'jetbrains-mono',
        fontWeight: 400,
        themeId: 'vsCodeDarkTheme',
        showLineNumbers: false,
      },
      frame: {
        id: crypto.randomUUID(),
        background: '#667eea',
        opacity: 100,
        padding: 64,
        radius: 8,
        visible: true,
      },
      terminal: {
        id: crypto.randomUUID(),
        opacity: 100,
        type: 'macOs',
        accentVisible: true,
        showHeader: true,
        showWatermark: true,
      },
      editorTabs: tabs.map(tab => ({
        ...tab,
        languageId: 'typescript',
        lineNumberStart: 1,
        marks: {lines: [], focusedLines: []},
      })),
      animation: animation ?? null,
    });
    const link = document.createElement('a');
    link.href = `/${id}`;
    document.body.append(link);
    link.click();
    link.remove();
    return id;
  }, project);
  await page.waitForURL(`**/${id}`);
  await page.waitForFunction(
    first => window.editorStore.editor.state.editors[0]?.id === first,
    project.tabs[0].id,
  );
  await page.waitForTimeout(500);
}

// The tabs of a saved project, which never share an id with the open ones.
const projectTabs = (prefix: string, count: number) =>
  TABS.slice(0, count).map(tab => ({...tab, id: `${prefix}-${tab.id}`}));

const lanes: Record<string, (page: Page) => Promise<void>> = {
  async 'Esc closes the timing popover from a segmented control'(page) {
    await openPanel(page);
    await page.locator('button', {hasText: 'fps'}).click();
    await page.getByRole('dialog').getByText('Snappy').click();
    assert.equal((await read(page)).settings.easing, 'snappy');
    await page.keyboard.press('Escape');
    await page.getByRole('dialog').waitFor({state: 'detached', timeout: 3000});
  },

  async 'a click inside a hold popover leaves the playhead alone'(page) {
    await openPanel(page);
    await button(page, /^Hold b\.ts/).click();
    await page.getByRole('dialog').locator('input').click();
    assert.deepEqual((await read(page)).playback, {state: 'editing'});
  },

  async 'a key typed on the preview reaches the code and no hotkey'(page) {
    await openPanel(page);
    const before = await read(page);
    await focusStageAt(page, 300);
    // P is the hotkey that changes the frame padding.
    await page.keyboard.press('p');
    const after = await read(page);
    assert.deepEqual(after.playback, {state: 'editing'});
    assert.equal(after.codes[0], `p${before.codes[0]}`);
    assert.equal(after.padding, before.padding);
    assert.equal(
      await page.evaluate(() =>
        document.activeElement?.classList.contains('cm-content'),
      ),
      true,
    );
  },

  async 'a key typed on the preview of a read-only project edits nothing'(
    page,
  ) {
    await openProject(page, {tabs: projectTabs('shared', 2), isOwner: false});
    await openPanel(page);
    const before = await read(page);
    await focusStageAt(page, 300);
    await page.keyboard.press('x');
    const after = await read(page);
    assert.deepEqual(after.playback, {state: 'editing'});
    assert.deepEqual(after.codes, before.codes);
  },

  async 'closing the panel removes the preview from the page'(page) {
    await openPanel(page);
    const children = await page.evaluate(() => document.body.children.length);
    await play(page);
    await stageShown(page);
    await button(page, 'Close animation').click();
    assert.equal(await page.locator(STAGE).count(), 0);
    assert.equal(
      await page.evaluate(() => document.body.children.length),
      children,
      'no measuring frame stays in the page',
    );
  },

  async 'a preview that failed is planned again on the next play'(page) {
    await openPanel(page);
    await page.evaluate(() => {
      const createRange = document.createRange.bind(document);
      let failures = 1;
      document.createRange = () => {
        if (failures-- > 0) throw new Error('lane: the measure fails once');
        return createRange();
      };
    });
    await play(page);
    await page
      .getByText('The animation preview could not be prepared')
      .waitFor();
    assert.deepEqual((await read(page)).playback, {state: 'editing'});
    await play(page);
    await stageShown(page);
  },

  async 'a measuring frame whose render fails leaves the page'(page) {
    await openPanel(page);
    const children = await page.evaluate(() => document.body.children.length);
    await page.evaluate(() => {
      const append = document.body.append.bind(document.body);
      let failures = 1;
      document.body.append = (...nodes) => {
        append(...nodes);
        const [host] = nodes;
        if (failures-- > 0 && host instanceof HTMLElement) {
          host.appendChild = () => {
            throw new Error('lane: the render fails once');
          };
        }
      };
    });
    await play(page);
    await page
      .getByText('The animation preview could not be prepared')
      .waitFor();
    assert.equal(
      await page.evaluate(() => document.body.children.length),
      children,
    );
  },

  async 'Stop returns the focus to the code'(page) {
    await openPanel(page);
    await play(page);
    await stageShown(page);
    await button(page, 'Stop and edit the code').click();
    assert.deepEqual((await read(page)).playback, {state: 'editing'});
    assert.equal(
      await page.evaluate(() =>
        document.activeElement?.classList.contains('cm-content'),
      ),
      true,
    );
  },

  async 'Play at the end starts again from the beginning'(page) {
    await openPanel(page);
    const {durationMs} = await read(page);
    await focusStageAt(page, durationMs);
    assert.equal((await read(page)).playhead, durationMs);
    await play(page);
    await page.waitForTimeout(300);
    const {playback, playhead} = await read(page);
    assert.equal(playback.state, 'playing');
    assert.ok(playhead < durationMs / 2, `the playhead is at ${playhead} ms`);
  },

  async 'scrubbing while it plays pauses at the scrubbed time'(page) {
    await openPanel(page);
    await play(page);
    await stageShown(page);
    const track = (await page
      .getByRole('slider', {name: 'Playhead'})
      .boundingBox())!;
    const y = track.y + track.height / 2;
    await page.mouse.move(track.x + track.width * 0.25, y);
    await page.mouse.down();
    assert.equal((await read(page)).playback.state, 'scrubbing');
    await page.mouse.move(track.x + track.width * 0.5, y, {steps: 4});
    await page.mouse.up();
    const {playback, durationMs} = await read(page);
    assert.equal(playback.state, 'paused');
    assert.ok(Math.abs(playback.atMs! - durationMs / 2) < durationMs * 0.02);
  },

  async 'a tab deleted while it plays leaves the steps and the preview'(page) {
    await openPanel(page);
    await play(page);
    await stageShown(page);
    // The stage covers the tabs, so only the store can delete one here.
    await page.evaluate(() =>
      window.editorStore.editor.actions.removeEditor('b'),
    );
    const {playback, settings} = await read(page);
    assert.deepEqual(playback, {state: 'editing'});
    assert.deepEqual(
      settings.steps.map(step => step.editorId),
      ['a', 'c'],
    );
    await play(page);
    await stageShown(page);
  },

  async 'opening another project while it plays shows that project'(page) {
    const saved = {
      // `gone` names a tab the project no longer has.
      steps: [
        {editorId: 'saved-c', holdMs: 300},
        {editorId: 'gone', holdMs: 900},
        {editorId: 'saved-a', holdMs: 400},
      ],
      transitionMs: 650,
      easing: 'linear',
      fps: 24,
    };
    await openProject(page, {tabs: projectTabs('saved', 3), animation: saved});
    assert.deepEqual((await read(page)).settings, {
      ...saved,
      steps: [
        {editorId: 'saved-c', holdMs: 300},
        {editorId: 'saved-a', holdMs: 400},
        {editorId: 'saved-b', holdMs: 800},
      ],
    });
    await openPanel(page);
    await play(page);
    await stageShown(page);
    await openProject(page, {tabs: projectTabs('other', 2)});
    const {playback, settings} = await read(page);
    assert.deepEqual(playback, {state: 'editing'});
    assert.deepEqual(settings, {
      steps: [
        {editorId: 'other-a', holdMs: 800},
        {editorId: 'other-b', holdMs: 800},
      ],
      transitionMs: 900,
      easing: 'smooth',
      fps: 30,
    });
    await page.locator(STAGE).waitFor({state: 'hidden'});
  },
};

async function main() {
  const selected = Object.entries(lanes).filter(
    ([name]) =>
      !args.lane?.length || args.lane.some(part => name.includes(part)),
  );
  const browser = await chromium.launch();
  const failed: string[] = [];
  try {
    for (const [name, lane] of selected) {
      const context = await browser.newContext({
        viewport: {width: 1440, height: 900},
      });
      if (args.worker) {
        const worker = args.worker;
        await context.route('**/mockServiceWorker.js', route =>
          route.fulfill({path: worker, contentType: 'text/javascript'}),
        );
      }
      const page = await context.newPage();
      try {
        await page.goto(args.url, {waitUntil: 'domcontentloaded'});
        await loadStore(page);
        const close = page.getByRole('button', {name: 'close', exact: true});
        if (await close.isVisible()) await close.click();
        await setTabs(page, TABS);
        await lane(page);
        console.log(`pass  ${name}`);
      } catch (error) {
        failed.push(name);
        console.log(`FAIL  ${name}`);
        console.log(String(error).split('\n').slice(0, 6).join('\n'));
      } finally {
        await context.close();
      }
    }
  } finally {
    await browser.close();
  }
  console.log(`${selected.length - failed.length} of ${selected.length} pass`);
  if (failed.length) process.exitCode = 1;
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
