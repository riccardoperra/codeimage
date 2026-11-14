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
} from './lib';

const {values: args} = parseArgs({
  options: {
    out: {type: 'string', default: '/tmp/codeimage-parity/takumi-vs-chrome'},
    only: {type: 'string'},
  },
});

const SCALE = 2;

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

async function matrix(): Promise<Cell[]> {
  const themes = await supportedThemeIds();
  return [
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
  const [mime, format] = FONT_FORMATS[extname(font.path)];
  const data = (await readFile(font.path)).toString('base64');
  const ranges = font.unicodeRange
    ?.map(([start, end]) => `U+${start.toString(16)}-${end.toString(16)}`)
    .join(',');
  return [
    '@font-face {',
    `font-family: ${JSON.stringify(font.family)};`,
    `src: url(data:${mime};base64,${data}) format('${format}');`,
    `font-weight: ${font.weight ?? '1 1000'};`,
    ranges ? `unicode-range: ${ranges};` : '',
    '}',
  ].join('');
}

async function renderInChrome(
  browser: Browser,
  markup: SnapshotMarkup,
  output: {width: number; height: number},
): Promise<Buffer> {
  const page = await browser.newPage({viewport: null});
  try {
    const faces = await Promise.all(markup.fonts.map(fontFace));
    const head = [...faces, ...markup.naturalCss]
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
      {width: clip.width * SCALE, height: clip.height * SCALE},
      'Node output must match the natural Chrome client box times scale',
    );
    return await page.screenshot({
      clip,
      omitBackground: true,
      animations: 'disabled',
    });
  } finally {
    await page.close();
  }
}

const slug = (name: string) => name.replace(/[^a-z0-9]+/gi, '-').toLowerCase();

async function main() {
  await mkdir(args.out, {recursive: true});
  const browser = await launchChrome(SCALE);
  const rows: string[] = [];
  let failed = 0;
  try {
    for (const cell of await matrix()) {
      if (args.only && !cell.name.includes(args.only)) continue;
      const markup = await snapshotMarkup(cell.document);
      const takumiBytes = (await renderSnapshot(cell.document)) as Uint8Array;
      const {width, height} = PNG.sync.read(Buffer.from(takumiBytes));
      const chromeBytes = await renderInChrome(browser, markup, {
        width,
        height,
      });
      const base = join(args.out, slug(cell.name));
      await writeFile(`${base}-takumi.png`, takumiBytes);
      await writeFile(`${base}-chrome.png`, chromeBytes);
      const percent = await diffPng(
        `${base}-chrome.png`,
        `${base}-takumi.png`,
        `${base}-diff.png`,
      );
      const pass = percent <= MAX_DIFF_PERCENT;
      if (!pass) failed++;
      rows.push(
        `| ${cell.name} | ${width}x${height} | ${percent.toFixed(2)}% | ${pass ? 'pass' : 'FAIL'} |`,
      );
      console.log(rows.at(-1));
    }
  } finally {
    await browser.close();
  }

  const table = [
    '| Cell | Size | Diff | Result |',
    '| --- | --- | --- | --- |',
    ...rows,
  ].join('\n');
  await writeFile(join(args.out, 'table.md'), `${table}\n`);
  console.log(`\n${table}\n\nImages in ${args.out}`);
  if (failed) {
    console.error(
      `${failed} cell(s) differ by more than ${MAX_DIFF_PERCENT}% at threshold ${PIXELMATCH_THRESHOLD}`,
    );
    process.exit(1);
  }
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
