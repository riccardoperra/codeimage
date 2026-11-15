import {mkdir, readFile, writeFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {join} from 'node:path';
import {parseArgs} from 'node:util';
import pixelmatch from 'pixelmatch';
import {chromium, type Browser, type Page} from 'playwright';
import {PNG} from 'pngjs';
import type {SnapshotInput} from '../../packages/render/dist/index.mjs';
import {MAX_DIFF_PERCENT, PIXELMATCH_THRESHOLD} from './lib.ts';
const launchChrome = (scale = 1) =>
  chromium.launch({
    channel: 'chrome',
    args: [`--force-device-scale-factor=${scale}`],
  });

// Pauses the editor's animation preview in Chrome at five times of the first
// transition and renders the same times with Takumi from the SSR scenes.
// Needs the web app on --url with the mock API, as `pnpm dev` starts it.
const {values: args} = parseArgs({
  options: {
    url: {type: 'string', default: 'http://localhost:4200/'},
    preview: {type: 'boolean', default: false},
    'free-size': {type: 'boolean', default: false},
    'render-root': {
      type: 'string',
      default: new URL('../../packages/render/', import.meta.url).pathname,
    },
    out: {type: 'string', default: '/tmp/codeimage-parity/animation-preview'},
    case: {type: 'string', multiple: true},
    scale: {type: 'string', default: '2'},
    worker: {type: 'string'},
    // Keeps the app's own font files. By default the page draws with the
    // render package's files, as Takumi does, so a diff measures the motion
    // and not the app's older Inter.
    'app-fonts': {type: 'boolean', default: false},
    // Also compares each hold with the static export frame of its tab, in
    // Chrome and in Takumi, to tell a gap of the preview from a static one.
    holds: {type: 'boolean', default: false},
    // Extra rules for the page, to measure what a change to the stage does.
    'stage-css': {type: 'string'},
  },
});

if (args.preview) {
  const {runPreviewParity} = await import('./animation-preview-live.ts');
  await runPreviewParity({
    url: args.url!,
    out: args.out!,
    renderRoot: args['render-root']!,
    scale: Number(args.scale),
    freeSize: args['free-size'],
  });
  process.exit(0);
}
const {parseSnapshotDocument} = await import(
  new URL(`${args['render-root']}/dist/index.mjs`, 'file://').href
);

const dist = new URL(`${args['render-root']}/dist/`, 'file://');
const require = createRequire(
  new URL(`${args['render-root']}/package.json`, 'file://'),
);
const {Renderer} = require('@takumi-rs/core');

type Document = ReturnType<typeof parseSnapshotDocument>;
// The part of the app's editor store the script reads in the page.
type EditorStore = {
  animation: {
    playback(): {state: string};
    playhead(): number;
    actions: {edit(): void};
  };
  editor: {actions: {setActiveEditorId(id: string): void}};
};
interface Settings {
  steps: {
    id?: string;
    editorId: string;
    holdMs: number;
    transition?: {ms: number; easing: string};
  }[];
  header?: {mode: 'tab' | 'title' | 'tabs'; title: string};
  transitionMs: number;
  easing: string;
  fps: 24 | 30 | 50 | 60;
}
interface Measured {
  width: number;
  height: number;
  transform: number[];
  children: Measured[];
  runs: {text: string; x: number; y: number; width: number}[];
}
interface Entry {
  renderFrame(
    document: Document,
    editorId?: string,
  ): Promise<{fontFamily: string; html: string; css: string}>;
  frameSizeCss(size?: {width: number; height: number}): string;
  targetLayout(
    frame: Document['frame'],
    natural: {width: number; height: number},
  ): {size: {width: number; height: number}; css: string} | undefined;
  renderAnimationScenes(
    document: Document,
    settings: Settings,
    measure: (html: string, css: string) => Promise<Measured>,
  ): Promise<{
    scenes: {html: string; durationMs: number}[];
    css: string;
    width: number;
    height: number;
    fontFamily: string;
  }>;
}
type FontFile = {
  file: string;
  weight?: number;
  unicodeRange?: [number, number][];
};

const HOLD_MS = 500;
const TRANSITION_MS = 900;
const settingsOf = (document: Document): Settings => ({
  steps: document.editor.editors.map(({id}) => ({
    editorId: id,
    holdMs: HOLD_MS,
  })),
  transitionMs: TRANSITION_MS,
  easing: 'smooth',
  fps: 30,
});
const PROGRESS = [0, 0.25, 0.5, 0.75, 1];

const RENAME_FROM = `function computeTotal(items: number[]) {
  return items.reduce((sum, item) => sum + item, 0);
}

console.log(computeTotal([1, 2, 3]));`;
const SHORT = `const greeting = 'hello';
console.log(greeting);`;
const numbered = (rows: number) =>
  Array.from(
    {length: rows},
    (_, index) => `const line${index} = greeting.length * ${index};`,
  ).join('\n');

const BASE = {
  $version: '1.10.0',
  $snippetId: null,
  format: 'png',
  frame: {
    background: 'linear-gradient(135deg, #667eea, #764ba2)',
    padding: 64,
    radius: 8,
    visible: true,
    opacity: 100,
  },
  terminal: {
    type: 'macOs',
    showHeader: true,
    accentVisible: true,
    shadow: '0 20px 40px rgba(0,0,0,.3)',
    background: '#282a36',
    textColor: '#f8f8f2',
    showWatermark: true,
    showGlassReflection: false,
    opacity: 100,
    alternativeTheme: false,
    borderType: 'glass',
  },
  options: {
    fontId: 'jetbrains-mono',
    fontWeight: 400,
    showLineNumbers: false,
    themeId: 'dracula',
    enableLigatures: true,
  },
};

type Tab = {code: string; marks?: unknown};
// Each case names its own tabs. The mounted code editor would otherwise keep
// the state of the last case's tab and map its marks onto the new code.
function pair(
  name: string,
  from: Tab,
  to: Tab,
  overrides: {options?: object; frame?: object} = {},
): SnapshotInput {
  const tab = (id: string, tabName: string, {code, marks}: Tab) => ({
    id,
    code,
    tabName,
    languageId: 'typescript',
    lineNumberStart: 1,
    ...(marks ? {marks} : {}),
  });
  return {
    $version: BASE.$version,
    $snippetId: BASE.$snippetId,
    format: BASE.format,
    scale: Number(args.scale),
    freeSize: args['free-size'],
    frame: {...BASE.frame, ...overrides.frame},
    terminal: BASE.terminal,
    editor: {
      options: {...BASE.options, ...overrides.options},
      editors: [
        tab(`${name}-a`, 'before.ts', from),
        tab(`${name}-b`, 'after.ts', to),
      ],
    },
  } as SnapshotInput;
}

const cases: {name: string; input: SnapshotInput}[] = [
  {
    name: 'rename',
    input: pair(
      'rename',
      {code: RENAME_FROM},
      {code: RENAME_FROM.replaceAll('computeTotal', 'sumItems')},
    ),
  },
  {
    name: 'grow',
    input: pair('grow', {code: SHORT}, {code: `${SHORT}\n${numbered(20)}`}),
  },
  {
    name: 'target-scale',
    input: pair(
      'target-scale',
      {code: SHORT},
      {code: numbered(45)},
      {frame: {exportTarget: 'x-landscape'}},
    ),
  },
  {
    name: 'gutter',
    input: pair(
      'gutter',
      {code: numbered(8)},
      {code: `import {a} from 'a';\nimport {b} from 'b';\n\n${numbered(8)}`},
      {options: {showLineNumbers: true}},
    ),
  },
  {
    name: 'marks-focus',
    input: pair(
      'marks-focus',
      {
        code: RENAME_FROM,
        marks: {
          lines: [
            {line: 2, kind: 'added'},
            {line: 5, kind: 'highlight'},
          ],
          focusedLines: [2],
        },
      },
      {
        code: `// totals\n${RENAME_FROM}`,
        marks: {
          lines: [
            {line: 1, kind: 'removed'},
            {line: 3, kind: 'highlight'},
          ],
          focusedLines: [3],
        },
      },
      {options: {showLineNumbers: true}},
    ),
  },
];

async function takumi() {
  const entry = (await import(
    new URL('ssr/entry-server.js', dist).href
  )) as Entry;
  const stylesheet = await readFile(
    new URL('ssr/assets/style.css', dist),
    'utf8',
  );
  const manifest = JSON.parse(
    await readFile(new URL('fonts/manifest.json', dist), 'utf8'),
  ) as {
    fonts: Record<string, FontFile[]>;
    fallbacks: {family: string; files: FontFile[]}[];
  };
  // The faces and the order of packages/render, as animation-endpoints.ts
  // registers them.
  const renderer = new Renderer();
  const register = async (family: string, files: FontFile[]) => {
    for (const {file, ...face} of files) {
      await renderer.registerFont({
        name: family,
        data: await readFile(new URL(`fonts/${file}`, dist)),
        ...face,
      });
    }
  };
  for (const {family, files} of manifest.fallbacks) {
    await register(family, files);
  }
  await register('Inter var', manifest.fonts.ui);
  const fontFamilies = manifest.fallbacks.map(({family}) => family);
  const registered = new Set<string>();
  const fontFaces = async (family: string, files: FontFile[]) =>
    (
      await Promise.all(
        files.map(async ({file, weight, unicodeRange}) => {
          const data = (
            await readFile(new URL(`fonts/${file}`, dist))
          ).toString('base64');
          const ranges = unicodeRange
            ?.map(
              ([start, end]) => `U+${start.toString(16)}-${end.toString(16)}`,
            )
            .join(',');
          return `@font-face{font-family:${JSON.stringify(family)};src:url(data:font/woff2;base64,${data}) format('woff2');font-weight:${weight ?? '1 1000'};${ranges ? `unicode-range:${ranges};` : ''}}`;
        }),
      )
    ).join('\n');

  const gradientCorner =
    /(linear-gradient\(\s*)to (left|right) (top|bottom)\b/g;
  const normalizeGradients = (css: string) =>
    css.replace(gradientCorner, '$1to $3 $2');
  const htmlTag = /<!--[\s\S]*?-->|<[^>"]*(?:"[^"]*"[^>"]*)*>/g;
  const styleAttribute = /"[^"]*"|(\sstyle=")([^"]*")/g;
  const normalizeHtml = (html: string) =>
    html.replace(htmlTag, tag =>
      tag.replace(styleAttribute, (match, name?: string, value?: string) =>
        name && value ? name + normalizeGradients(value) : match,
      ),
    );
  const pageCss = (css: string) => [stylesheet, css].map(normalizeGradients);
  const inCssPixels = (node: Measured, scale: number): Measured => ({
    width: node.width / scale,
    height: node.height / scale,
    transform: node.transform.map((value, index) =>
      index < 4 ? value : value / scale,
    ),
    children: node.children.map(child => inCssPixels(child, scale)),
    runs: node.runs.map(run => ({
      text: run.text,
      x: run.x / scale,
      y: run.y / scale,
      width: run.width / scale,
    })),
  });

  return async (document: Document) => {
    const {fontId} = document.editor.options;
    const {fontFamily} = await entry.renderFrame(document);
    if (!registered.has(fontId)) {
      await register(fontFamily, manifest.fonts[fontId]);
      registered.add(fontId);
    }
    const faces = [
      await fontFaces('Inter', manifest.fonts.ui),
      await fontFaces('Inter var', manifest.fonts.ui),
      await fontFaces(fontFamily, manifest.fonts[fontId]),
    ].join('\n');
    const animation = await entry.renderAnimationScenes(
      document,
      settingsOf(document),
      async (html, css) =>
        inCssPixels(
          await renderer.measure(normalizeHtml(html), {
            css: pageCss(css),
            fontFamilies,
            devicePixelRatio: document.scale,
          }),
          document.scale,
        ),
    );
    // The scene and its own time at a time of the whole timeline, as the
    // preview and Takumi's renderAnimation pick them.
    const sceneAt = (ms: number) => {
      let start = 0;
      for (const scene of animation.scenes) {
        if (ms < start + scene.durationMs) return {scene, timeMs: ms - start};
        start += scene.durationMs;
      }
      const last = animation.scenes.at(-1)!;
      return {scene: last, timeMs: last.durationMs};
    };
    return {
      faces,
      // The static export of one tab, as animation-endpoints.ts renders it.
      staticOf: async (editorId: string) => {
        const {scale} = document;
        const frame = await entry.renderFrame(document, editorId);
        const html = normalizeHtml(frame.html);
        const css = pageCss(frame.css);
        const content = await renderer.measure(html, {
          css: [...css, entry.frameSizeCss()],
          fontFamilies,
          devicePixelRatio: scale,
        });
        const natural = {
          width: content.width / scale,
          height: content.height / scale,
        };
        const target = entry.targetLayout(document.frame, natural);
        const layout = target?.size ?? natural;
        return PNG.sync.read(
          Buffer.from(
            await renderer.render(html, {
              width: Math.floor(Math.round(layout.width) * scale),
              height: Math.floor(Math.round(layout.height) * scale),
              css: [...css, entry.frameSizeCss(layout), target?.css ?? ''],
              fontFamilies,
              format: 'png',
              devicePixelRatio: scale,
            }),
          ),
        );
      },
      frameAt: async (ms: number) => {
        const {scene, timeMs} = sceneAt(ms);
        return PNG.sync.read(
          Buffer.from(
            await renderer.render(normalizeHtml(scene.html), {
              width: animation.width * document.scale,
              height: animation.height * document.scale,
              css: pageCss(animation.css),
              fontFamilies,
              format: 'png',
              devicePixelRatio: document.scale,
              timeMs,
            }),
          ),
        );
      },
    };
  };
}

const STAGE = '[data-animation-stage]';
// The frame the web export captures.
const EXPORT_FRAME = '[class*="previewPortal"]';

// Draws only `selector`, at the top left of the page, unzoomed. The parts it
// hides itself stay hidden, such as the spacer of the gutter.
const showOnly = (page: Page, selector: string) =>
  page.evaluate(
    css => {
      const style =
        window.document.querySelector('#parity-only') ??
        window.document.head.appendChild(
          Object.assign(window.document.createElement('style'), {
            id: 'parity-only',
          }),
        );
      style.textContent = css;
    },
    `
html, body { background: transparent !important; }
body *:not(${selector}, ${selector} *) { visibility: hidden !important; }
${selector} { visibility: visible !important; opacity: 1 !important; position: fixed !important; left: 0 !important; top: 0 !important; zoom: 1 !important; z-index: 2147483647 !important; }
${selector}::after { display: none !important; }
`,
  );

async function openPreview(page: Page) {
  if (args.worker) {
    const worker = args.worker;
    await page.route('**/mockServiceWorker.js', route =>
      route.fulfill({path: worker, contentType: 'text/javascript'}),
    );
  }
  await page.goto(args.url, {waitUntil: 'domcontentloaded'});
  await page
    .locator('.cm-content[contenteditable="true"]')
    .waitFor({timeout: 300_000});
  const close = page.getByRole('button', {name: 'close', exact: true});
  if (await close.isVisible()) await close.click();
  await showOnly(page, STAGE);
  if (args['stage-css']) await page.addStyleTag({content: args['stage-css']});
}

// Loads the case into the editor's stores. The mounted code editor syncs
// its tab back once, which can drop the marks of the case, so the case is
// applied until the store holds it unchanged.
async function loadCase(page: Page, document: Document, faces: string) {
  if (!args['app-fonts']) {
    await page.addStyleTag({content: faces});
    await page.evaluate(() => window.document.fonts.ready);
  }
  for (let attempt = 0; attempt < 5; attempt++) {
    const settled = await page.evaluate(
      async ({document, settings}) => {
        // The module the app loaded, so the page shares its stores.
        const editorState = '/src/state/editor/index.ts';
        const {getEditorStore} = await import(/* @vite-ignore */ editorState);
        const store = getEditorStore();
        Object.assign(window, {editorStore: store});
        store.animation.actions.edit();
        store.editor.actions.setFromPersistedState(document.editor);
        store.frame.setFromPersistedState(document.frame);
        store.terminal.setFromPersistedState(document.terminal);
        store.animation.actions.setFromPersistedState(settings);
        store.animation.actions.setOpen(true);
        await new Promise(resolve => setTimeout(resolve, 500));
        // tsx names declared functions with a helper the page lacks, so the
        // two lists are compared inline.
        return [store.editor.stateToPersist().editors, document.editor.editors]
          .map(editors =>
            JSON.stringify(
              editors.map(({id, code, marks}: (typeof editors)[number]) => ({
                id,
                code,
                marks: marks ?? {lines: [], focusedLines: []},
              })),
            ),
          )
          .every((tabs, _, [first]) => tabs === first);
      },
      {document, settings: settingsOf(document)},
    );
    if (settled) return;
  }
  throw new Error('The editor did not keep the tabs of the case');
}

async function previewAt(page: Page, ms: number) {
  await page.evaluate(async ms => {
    const editorState = '/src/state/editor/index.ts';
    const {getEditorStore} = await import(/* @vite-ignore */ editorState);
    getEditorStore().animation.actions.seek(ms);
  }, ms);
  // A predicate that returns a promise counts as true at once, so the
  // store was kept on the window for a synchronous check.
  await page.waitForFunction(
    ms => {
      const {animation} = (window as unknown as {editorStore: EditorStore})
        .editorStore;
      const stage = window.document.querySelector<HTMLElement>(
        '[data-animation-stage]',
      );
      return (
        animation.playback().state === 'paused' &&
        animation.playhead() === ms &&
        stage !== null &&
        stage.style.display !== 'none' &&
        stage.offsetWidth > 0
      );
    },
    ms,
    {timeout: 60_000},
  );
  await page.evaluate(
    () =>
      new Promise(resolve =>
        requestAnimationFrame(() => requestAnimationFrame(resolve)),
      ),
  );
  const box = await page
    .locator('[data-animation-scene]:not([style*="none"])')
    .evaluate(element => {
      const {x, y, width, height} = element.getBoundingClientRect();
      return {x, y, width, height};
    });
  return PNG.sync.read(
    await page.screenshot({
      clip: box,
      omitBackground: true,
      animations: 'allow',
    }),
  );
}

// The static frame of one tab, as the web export draws it.
async function exportFrameOf(page: Page, editorId: string) {
  await page.evaluate(editorId => {
    const {animation, editor} = (
      window as unknown as {editorStore: EditorStore}
    ).editorStore;
    animation.actions.edit();
    editor.actions.setActiveEditorId(editorId);
  }, editorId);
  // The export frame takes the size the editor frame measures after a timeout.
  await page.waitForTimeout(800);
  await showOnly(page, EXPORT_FRAME);
  try {
    const box = await page
      .locator(`${EXPORT_FRAME} [class*="Frame_container"]`)
      .evaluate(element => {
        const {x, y, width, height} = element.getBoundingClientRect();
        return {x, y, width, height};
      });
    return PNG.sync.read(
      await page.screenshot({clip: box, omitBackground: true}),
    );
  } finally {
    await showOnly(page, STAGE);
  }
}

function diffPercent(a: PNG, b: PNG, file: string) {
  const diff = new PNG({width: a.width, height: a.height});
  const pixels = pixelmatch(a.data, b.data, diff.data, a.width, a.height, {
    threshold: PIXELMATCH_THRESHOLD,
  });
  return {
    percent: (pixels / (a.width * a.height)) * 100,
    write: () => writeFile(file, PNG.sync.write(diff)),
  };
}

async function main() {
  await mkdir(args.out, {recursive: true});
  const render = await takumi();
  const browsers = new Map<number, {browser: Browser; page: Page}>();
  const pageAt = async (scale: number) => {
    if (!browsers.has(scale)) {
      const browser = await launchChrome(scale);
      const page = await browser.newPage({viewport: null});
      await openPreview(page);
      browsers.set(scale, {browser, page});
    }
    return browsers.get(scale)!.page;
  };
  const selected = args.case?.length
    ? cases.filter(({name}) => args.case!.includes(name))
    : cases;
  const rows: Record<string, unknown>[] = [];
  let failed = false;
  try {
    for (const {name, input} of selected) {
      const document = parseSnapshotDocument(input);
      const takumiCase = await render(document);
      const page = await pageAt(document.scale);
      await loadCase(page, document, takumiCase.faces);
      for (const progress of PROGRESS) {
        const ms = HOLD_MS + progress * TRANSITION_MS;
        const chrome = {png: await previewAt(page, ms)};
        const expected = await takumiCase.frameAt(ms);
        const slug = `${name}-${progress * 100}`;
        await writeFile(
          join(args.out, `${slug}-chrome.png`),
          PNG.sync.write(chrome.png),
        );
        await writeFile(
          join(args.out, `${slug}-takumi.png`),
          PNG.sync.write(expected),
        );
        const sameSize =
          chrome.png.width === expected.width &&
          chrome.png.height === expected.height;
        const diff = sameSize
          ? diffPercent(
              chrome.png,
              expected,
              join(args.out, `${slug}-diff.png`),
            )
          : null;
        await diff?.write();
        const ok = diff !== null && diff.percent <= MAX_DIFF_PERCENT;
        failed ||= !ok;
        rows.push({
          case: name,
          at: `${progress * 100}%`,
          ms,
          chrome: `${chrome.png.width}x${chrome.png.height}`,
          takumi: `${expected.width}x${expected.height}`,
          diff: diff ? `${diff.percent.toFixed(3)}%` : 'size differs',
          ok,
        });
        console.log(JSON.stringify(rows.at(-1)));
      }
      if (!args.holds) continue;
      const tabs = document.editor.editors.map(({id}) => id);
      for (const [hold, editorId, progress] of [
        ['from', tabs[0], 0],
        ['to', tabs[1], 1],
      ] as const) {
        const read = async (renderer: string) =>
          PNG.sync.read(
            await readFile(
              join(args.out, `${name}-${progress * 100}-${renderer}.png`),
            ),
          );
        const images = {
          stage: await read('chrome'),
          'takumi hold': await read('takumi'),
          'export frame': await exportFrameOf(page, editorId),
          'takumi static': await takumiCase.staticOf(editorId),
        };
        const compare = (a: keyof typeof images, b: keyof typeof images) => {
          const [first, second] = [images[a], images[b]];
          return first.width === second.width && first.height === second.height
            ? `${diffPercent(first, second, '').percent.toFixed(3)}%`
            : 'size differs';
        };
        console.log(
          JSON.stringify({
            case: name,
            hold,
            'stage vs takumi hold': compare('stage', 'takumi hold'),
            'takumi hold vs takumi static': compare(
              'takumi hold',
              'takumi static',
            ),
            'export frame vs takumi static': compare(
              'export frame',
              'takumi static',
            ),
            'stage vs export frame': compare('stage', 'export frame'),
          }),
        );
      }
    }
  } finally {
    for (const {browser} of browsers.values()) await browser.close();
  }
  console.table(rows);
  await writeFile(
    join(args.out, 'results.json'),
    JSON.stringify(rows, null, 2),
  );
  if (failed) process.exitCode = 1;
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
