import pixelmatch from 'pixelmatch';
import {
  createAmbientBackground,
  createWindowPalette,
} from '../../apps/codeimage/src/components/Terminal/windowPalette';
import assert from 'node:assert/strict';
import {mkdir, readFile, writeFile} from 'node:fs/promises';
import {extname, join} from 'node:path';
import {parseArgs} from 'node:util';
import type {Browser} from 'playwright';
import {PNG} from 'pngjs';
import type {
  SnapshotFont,
  SnapshotInput,
  SnapshotMarkup,
} from '../../packages/render/dist/index.mjs';
import {
  renderSnapshot,
  snapshotMarkup,
  supportedThemeIds,
} from '../../packages/render/dist/index.mjs';
import {
  diffPng,
  launchChrome,
  MAX_DIFF_PERCENT,
  PIXELMATCH_THRESHOLD,
  serveFixtureImages,
} from './lib';

const {values: args} = parseArgs({
  options: {
    out: {type: 'string', default: '/tmp/codeimage-parity/takumi-vs-chrome'},
    only: {type: 'string'},
  },
});

const SCALE = 2;
const MAX_MARKS_DIFF_PERCENT = 0.01;
const webMarksCss = readFile(
  new URL(
    '../../apps/codeimage/src/components/CustomEditor/plugins/lineMarks/marks.css',
    import.meta.url,
  ),
  'utf8',
);

const DEFAULT_CODE = [
  'function Counter() {',
  '  const [count, setCount] = createSignal(0);',
  '  ',
  '  setInterval(',
  '    () => setCount(count() + 1),',
  '    1000',
  '  );',
  '',
  '  return <div>The count is {count()}</div>',
  '}',
].join('\n');

interface Cell {
  name: string;
  document: SnapshotInput;
  avatar?: 'fixture' | 'offline';
  checkMarks?: boolean;
}

interface Region {
  x: number;
  y: number;
  width: number;
  height: number;
}

function snapshot(
  themeId: string,
  overrides: {
    frame?: Record<string, unknown>;
    terminal?: Record<string, unknown>;
    options?: Record<string, unknown>;
    editor?: Record<string, unknown>;
  } = {},
): SnapshotInput {
  return {
    $version: '1.10.0',
    $snippetId: null,
    format: 'png',
    scale: SCALE,
    frame: {
      background: null,
      padding: 64,
      radius: 8,
      visible: true,
      opacity: 100,
      ...overrides.frame,
    },
    terminal: {
      type: 'macOs',
      showHeader: true,
      accentVisible: true,
      shadow: 'rgba(0, 0, 0, 0.45) 0px 25px 20px -20px',
      background: '',
      textColor: '',
      showWatermark: true,
      showGlassReflection: false,
      opacity: 100,
      alternativeTheme: false,
      borderType: 'glass',
      ...overrides.terminal,
    },
    editor: {
      options: {
        fontId: 'jetbrains-mono',
        fontWeight: 400,
        showLineNumbers: false,
        themeId,
        enableLigatures: true,
        ...overrides.options,
      },
      editors: [
        {
          id: 'parity',
          code: DEFAULT_CODE,
          tabName: 'index.tsx',
          languageId: 'typescript',
          lineNumberStart: 1,
          ...overrides.editor,
        },
      ],
    },
  };
}

async function matrix(fixtureUrl: string): Promise<Cell[]> {
  const themes = await supportedThemeIds();
  const p10: Cell[] = [];
  for (const themeId of ['githubDark', 'githubLight']) {
    for (const type of ['card', 'editor', 'shell']) {
      for (const surface of ['solid', 'wash'])
        p10.push({
          name: `P10 ${type} ${themeId} ${surface}`,
          document: snapshot(themeId, {
            terminal: {type, surface},
            editor: {tabName: 'src/app/index.tsx'},
          }),
        });
    }
    p10.push({
      name: `P10 macOs ${themeId} wash hairline`,
      document: snapshot(themeId, {
        terminal: {surface: 'wash', borderType: 'hairline'},
      }),
    });
    for (const style of ['minimal', 'pill', 'card']) {
      for (const icon of [false, true])
        p10.push({
          name: `P10 ${style} ${themeId} icon-${icon}`,
          document: snapshot(themeId, {
            frame: {
              background: themeId === 'githubDark' ? '#121212' : '#f5f5f5',
              exportTarget: 'x-landscape',
              signature: {
                handle: 'octocat',
                name: 'Zoë Łukasz',
                style,
                platform: icon ? 'github' : null,
              },
            },
          }),
        });
    }
  }
  const card = {
    handle: 'octocat',
    name: 'The Octocat',
    style: 'card',
    platform: 'github',
    avatar: 'profile',
    position: 'bottom-center',
  };
  p10.push(
    {
      name: 'P10 card fixture avatar bottom-center',
      avatar: 'fixture',
      document: snapshot('githubDark', {
        frame: {exportTarget: 'x-landscape', signature: card},
      }),
    },
    {
      name: 'P10 card offline initials',
      avatar: 'offline',
      document: snapshot('githubDark', {
        frame: {exportTarget: 'x-landscape', signature: card},
      }),
    },
    ...['light', 'dark'].map(tone => ({
      name: `P10 signature over ${tone} image`,
      document: snapshot('githubDark', {
        frame: {
          background: `link:${fixtureUrl}/${tone}.png`,
          exportTarget: 'x-landscape',
          signature: {...card, avatar: null},
        },
      }),
    })),
    {
      name: 'P10 terminal alias',
      document: snapshot('githubDark', {
        terminal: {type: 'terminal', surface: 'wash'},
      }),
    },
    {
      name: 'P10 bare padding zero',
      document: snapshot('githubDark', {
        terminal: {type: 'card', showHeader: false},
        frame: {padding: 0, radius: 0},
      }),
    },
    {
      name: 'P10 ambient two tabs',
      document: (() => {
        const document = snapshot('githubDark', {
          frame: {
            background: createAmbientBackground(
              createWindowPalette({
                background: '#0d1117',
                text: '#c9d1d9',
                accent: '#58a6ff',
              }),
            ),
          },
          terminal: {type: 'editor', surface: 'wash'},
        });
        document.editor.editors.push({
          ...document.editor.editors[0],
          id: 'second',
          tabName: 'other.ts',
        });
        return document;
      })(),
    },
    {
      name: 'P10 square sixty lines',
      document: snapshot('githubDark', {
        frame: {exportTarget: 'square', signature: {...card, avatar: null}},
        editor: {code: 'const value = 1;\n'.repeat(60)},
      }),
    },
  );
  return [
    ...p10,
    ...themes.map(themeId => ({
      name: `${themeId} / macOs`,
      document: snapshot(themeId),
    })),
    ...['macOsGrayTheme', 'macOsOutlineTheme', 'windows'].map(type => ({
      name: `vsCodeDarkTheme / ${type}`,
      document: snapshot('vsCodeDarkTheme', {terminal: {type}}),
    })),
    {
      name: 'line numbers from 42',
      document: snapshot('dracula', {
        options: {showLineNumbers: true},
        editor: {lineNumberStart: 42},
      }),
    },
    {
      name: 'marks with line numbers',
      checkMarks: true,
      document: snapshot('vsCodeDarkTheme', {
        options: {showLineNumbers: true},
        editor: {
          lineNumberStart: 42,
          marks: {
            lines: [
              {line: 2, kind: 'removed'},
              {line: 3, kind: 'added'},
              {line: 5, kind: 'highlight'},
              {line: 6, kind: 'highlight'},
            ],
            focusedLines: [5, 6, 7],
          },
        },
      }),
    },
    {
      name: 'marks without line numbers',
      checkMarks: true,
      document: snapshot('vsCodeDarkTheme', {
        editor: {
          marks: {
            lines: [
              {line: 2, kind: 'removed'},
              {line: 3, kind: 'added'},
              {line: 5, kind: 'highlight'},
              {line: 6, kind: 'highlight'},
            ],
            focusedLines: [5, 6, 7],
          },
        },
      }),
    },
    {
      name: 'marks light with line numbers',
      checkMarks: true,
      document: snapshot('githubLight', {
        options: {showLineNumbers: true},
        editor: {
          marks: {
            lines: [
              {line: 2, kind: 'removed'},
              {line: 3, kind: 'added'},
              {line: 5, kind: 'highlight'},
              {line: 6, kind: 'highlight'},
            ],
            focusedLines: [5, 6, 7],
          },
        },
      }),
    },
    {
      name: 'glass reflection',
      document: snapshot('nightOwlTheme', {
        terminal: {showGlassReflection: true},
      }),
    },
    {
      name: 'opacity 50, radius 0',
      document: snapshot('dracula', {
        frame: {opacity: 50, radius: 0},
        terminal: {opacity: 50},
      }),
    },
    {
      name: 'alternative theme, no watermark',
      document: snapshot('githubDark', {
        terminal: {alternativeTheme: true, showWatermark: false},
      }),
    },
    {
      name: 'no header',
      document: snapshot('materialOcean', {terminal: {showHeader: false}}),
    },
    {
      name: 'line wider than 1920 px, width 500',
      document: {
        ...snapshot('dracula', {
          options: {showLineNumbers: true},
          editor: {
            code: `const note = "${'a line the frame must not wrap '.repeat(8)}";\n${DEFAULT_CODE}`,
          },
        }),
        width: 500,
      },
    },
  ];
}

const FONT_FORMATS: Record<string, [mime: string, format: string]> = {
  '.woff2': ['font/woff2', 'woff2'],
  '.ttf': ['font/ttf', 'truetype'],
};

async function fontFace(font: SnapshotFont): Promise<string> {
  const [mime, format] = FONT_FORMATS[extname(font.file)];
  const data = Buffer.from(font.data).toString('base64');
  const ranges = font.unicodeRange
    ?.map(([start, end]) => `U+${start.toString(16)}-${end.toString(16)}`)
    .join(',');
  return [
    '@font-face {',
    `font-family: ${JSON.stringify(font.family)};`,
    `src: url(data:${mime};base64,${data}) format('${format}');`,
    `font-weight: ${font.weight ?? '100 900'};`,
    ranges ? `unicode-range: ${ranges};` : '',
    '}',
  ].join('');
}

async function renderInChrome(
  browser: Browser,
  markup: SnapshotMarkup,
  output: {width: number; height: number},
  checkMarks: boolean,
): Promise<{
  bytes: Buffer;
  crop: Region | null;
  marksStrip: Region | null;
}> {
  const page = await browser.newPage({viewport: null});
  try {
    await page.route('**/*', async route => {
      const source = markup.images.find(
        image => image.src === route.request().url(),
      );
      if (source)
        await route.fulfill({
          contentType: 'image/png',
          body: Buffer.from(new Uint8Array(source.data)),
        });
      else await route.continue();
    });
    const faces = await Promise.all(markup.fonts.map(fontFace));
    // The web app loads marks.css after CodeMirror. Keep this reference independent
    // of the Node renderer's CSS order so clipping regressions remain visible.
    const head = [...markup.naturalCss, await webMarksCss, ...faces]
      .map(css => `<style>${css}</style>`)
      .join('');
    await page.setContent(
      markup.html.replace(
        '<html>',
        `<!doctype html><html><head>${head}</head>`,
      ),
    );
    await page.evaluate(() => document.fonts.ready);
    const clip = await page.locator('[data-snapshot-frame]').evaluate(el => {
      const {x, y} = el.getBoundingClientRect();
      return {x, y, width: el.clientWidth, height: el.clientHeight};
    });
    assert.deepEqual(
      output,
      {
        width: clip.width * markup.document.scale,
        height: clip.height * markup.document.scale,
      },
      'Node output must match the natural Chrome client box times scale',
    );
    await page
      .locator('img')
      .evaluateAll((images: HTMLImageElement[]) =>
        Promise.all(images.map(image => image.decode())),
      );
    const mark = page.locator('[data-frame-signature] > div').first();
    const bounds = (await mark.count()) ? await mark.boundingBox() : null;
    const scale = markup.document.scale;
    const crop = bounds
      ? {
          x: Math.max(0, Math.floor((bounds.x - clip.x - 8) * scale)),
          y: Math.max(0, Math.floor((bounds.y - clip.y - 8) * scale)),
          width: Math.ceil((bounds.width + 16) * scale),
          height: Math.ceil((bounds.height + 16) * scale),
        }
      : null;
    // Only the left-inset pseudo-elements draw signs and highlight bars. Exclude
    // gutter digits and code text, whose rasterization varies across platforms.
    const marksStrip = checkMarks
      ? await page
          .locator(
            '[data-line-marks] .cm-lineNumbers :is(.cm-lineMark-added, .cm-lineMark-removed, .cm-lineMark-highlight), ' +
              '[data-line-marks]:not([data-line-numbers="true"]) [data-mark]',
          )
          .evaluateAll(
            (elements, {x, y, scale}) => {
              if (!elements.length) throw new Error('No mark signs to compare');
              const boxes = elements.map(el => {
                const rect = el.getBoundingClientRect();
                const before = getComputedStyle(el, '::before');
                const width = parseFloat(before.width);
                if (!(width > 0) || before.content === 'none') {
                  throw new Error(
                    'Mark inset must have a visible pseudo-element',
                  );
                }
                return {
                  left: rect.left - width,
                  right: rect.left,
                  top: rect.top,
                  bottom: rect.bottom,
                };
              });
              const left = Math.floor(
                (Math.min(...boxes.map(b => b.left)) - x) * scale,
              );
              const top = Math.floor(
                (Math.min(...boxes.map(b => b.top)) - y) * scale,
              );
              const right = Math.ceil(
                (Math.max(...boxes.map(b => b.right)) - x) * scale,
              );
              const bottom = Math.ceil(
                (Math.max(...boxes.map(b => b.bottom)) - y) * scale,
              );
              return {
                x: left,
                y: top,
                width: right - left,
                height: bottom - top,
              };
            },
            {...clip, scale},
          )
      : null;
    return {
      crop,
      marksStrip,
      bytes: await page.screenshot({
        clip,
        omitBackground: true,
        animations: 'disabled',
      }),
    };
  } finally {
    await page.close();
  }
}

const slug = (name: string) => name.replace(/[^a-z0-9]+/gi, '-').toLowerCase();

function cropPng(bytes: Uint8Array, {x, y, width, height}: Region) {
  const source = PNG.sync.read(Buffer.from(bytes));
  const crop = new PNG({width, height});
  PNG.bitblt(source, crop, x, y, width, height, 0, 0);
  return PNG.sync.write(crop);
}

async function main() {
  await mkdir(args.out, {recursive: true});
  const fixtures = await serveFixtureImages();
  const fixtureUrl = fixtures.url;
  const browsers = await Promise.all([launchChrome(1), launchChrome(SCALE)]);
  const originalFetch = globalThis.fetch;
  const rows: string[] = [];
  let failed = 0;
  try {
    for (const cell of await matrix(fixtureUrl)) {
      if (args.only && !cell.name.includes(args.only)) continue;
      globalThis.fetch = (input, init) => {
        if (
          String(input).startsWith('https://avatars.githubusercontent.com/')
        ) {
          if (cell.avatar === 'offline')
            return Promise.reject(new TypeError('offline fixture'));
          return originalFetch(`${fixtureUrl}/avatar.png`, init);
        }
        return originalFetch(input, init);
      };
      const markup = await snapshotMarkup(cell.document);
      const takumiBytes = (await renderSnapshot(cell.document)) as Uint8Array;
      const {width, height} = PNG.sync.read(Buffer.from(takumiBytes));
      const {
        bytes: chromeBytes,
        crop,
        marksStrip,
      } = await renderInChrome(
        browsers[markup.document.scale === 1 ? 0 : 1],
        markup,
        {width, height},
        cell.checkMarks ?? false,
      );
      const base = join(args.out, slug(cell.name));
      await writeFile(`${base}.json`, JSON.stringify(cell.document, null, 2));
      await writeFile(`${base}-takumi.png`, takumiBytes);
      await writeFile(`${base}-chrome.png`, chromeBytes);
      const percent = await diffPng(
        `${base}-chrome.png`,
        `${base}-takumi.png`,
        `${base}-diff.png`,
      );
      let cropPercent: number | null = null;
      if (crop) {
        const chrome = PNG.sync.read(chromeBytes);
        const takumi = PNG.sync.read(Buffer.from(takumiBytes));
        const width = Math.min(crop.width, chrome.width - crop.x);
        const height = Math.min(crop.height, chrome.height - crop.y);
        const extract = (image: PNG) => {
          const out = new PNG({width, height});
          PNG.bitblt(image, out, crop.x, crop.y, width, height, 0, 0);
          return out;
        };
        const reference = extract(chrome);
        const actual = extract(takumi);
        const diff = new PNG({width, height});
        cropPercent =
          (pixelmatch(reference.data, actual.data, diff.data, width, height, {
            threshold: PIXELMATCH_THRESHOLD,
          }) /
            (width * height)) *
          100;
        await writeFile(`${base}-signature-diff.png`, PNG.sync.write(diff));
      }
      let marksPercent: number | null = null;
      if (marksStrip) {
        await Promise.all([
          writeFile(
            `${base}-marks-chrome.png`,
            cropPng(chromeBytes, marksStrip),
          ),
          writeFile(
            `${base}-marks-takumi.png`,
            cropPng(takumiBytes, marksStrip),
          ),
        ]);
        marksPercent = await diffPng(
          `${base}-marks-chrome.png`,
          `${base}-marks-takumi.png`,
          `${base}-marks-diff.png`,
        );
      }
      const pass =
        percent <= MAX_DIFF_PERCENT &&
        (cropPercent === null || cropPercent <= MAX_DIFF_PERCENT) &&
        (marksPercent === null || marksPercent <= MAX_MARKS_DIFF_PERCENT);
      if (!pass) failed++;
      rows.push(
        `| ${cell.name} | ${width}x${height} | ${percent.toFixed(2)}% | ${cropPercent === null ? '-' : `${cropPercent.toFixed(2)}%`} | ${marksPercent === null ? '-' : `${marksPercent.toFixed(3)}%`} | ${pass ? 'pass' : 'FAIL'} |`,
      );
      console.log(rows.at(-1));
    }
  } finally {
    globalThis.fetch = originalFetch;
    await Promise.all(browsers.map(browser => browser.close()));
    await fixtures.close();
  }

  const table = [
    '| Cell | Size | Diff | Signature crop | Marks strip | Result |',
    '| --- | --- | --- | --- | --- | --- |',
    ...rows,
  ].join('\n');
  await writeFile(join(args.out, 'table.md'), `${table}\n`);
  console.log(`\n${table}\n\nImages in ${args.out}`);
  if (failed) {
    console.error(
      `${failed} cell(s) exceed their diff tolerance at threshold ${PIXELMATCH_THRESHOLD}`,
    );
    process.exit(1);
  }
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
