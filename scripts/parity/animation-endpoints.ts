import {mkdir, readFile, writeFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {join} from 'node:path';
import {parseArgs} from 'node:util';
import pixelmatch from 'pixelmatch';
import {PNG} from 'pngjs';
import type {SnapshotInput} from '../../packages/render/dist/index.mjs';
import {
  parseSnapshotDocument,
  renderSnapshot,
} from '../../packages/render/dist/index.mjs';
import {decodeAnimation} from './animation-frames';
import {MAX_DIFF_PERCENT, PIXELMATCH_THRESHOLD} from './lib';

const {values: args} = parseArgs({
  options: {
    out: {type: 'string', default: '/tmp/codeimage-parity/animation'},
    case: {type: 'string', multiple: true},
    scale: {type: 'string', default: '2'},
    // Also encodes each case with Takumi renderAnimation and checks the
    // frames that animation-frames.ts decodes from it.
    encode: {type: 'boolean', default: false},
    // Moves a layer of the first transition frame, as code:2 or gutter:2,
    // to show that the layout check catches it.
    shift: {type: 'string'},
  },
});
const out = args.out;

const dist = new URL('../../packages/render/dist/', import.meta.url);
const require = createRequire(
  new URL('../../packages/render/package.json', import.meta.url),
);
const {Renderer} = require('@takumi-rs/core');

// Takumi gives each node its absolute matrix, and each text run relative to
// the content box of its node.
interface Measured {
  width: number;
  height: number;
  transform: number[];
  children: Measured[];
  runs: {text: string; x: number; y: number; width: number}[];
}
interface Scenes {
  scenes: {html: string; durationMs: number}[];
  css: string;
  width: number;
  height: number;
}
type Document = ReturnType<typeof parseSnapshotDocument>;
interface Entry {
  renderFrame(
    document: Document,
    editorId?: string,
  ): Promise<{html: string; css: string; fontFamily: string}>;
  frameSizeCss(size?: {width: number; height: number}): string;
  targetLayout(
    frame: Document['frame'],
    natural: {width: number; height: number},
  ): {size: {width: number; height: number}; css: string} | undefined;
  renderAnimationScenes(
    document: Document,
    settings: Settings,
    measure: (html: string, css: string) => Promise<Measured>,
  ): Promise<Scenes>;
}
interface Settings {
  steps: {editorId: string; holdMs: number}[];
  transitionMs: number;
  easing: 'smooth' | 'snappy' | 'linear';
  fps: 24 | 30 | 50 | 60;
}

async function main() {
  const entry = (await import(
    new URL('ssr/entry-server.js', dist).href
  )) as Entry;
  const stylesheet = await readFile(
    new URL('ssr/assets/style.css', dist),
    'utf8',
  );
  type FontFile = {
    file: string;
    weight?: number;
    unicodeRange?: [number, number][];
  };
  const manifest = JSON.parse(
    await readFile(new URL('fonts/manifest.json', dist), 'utf8'),
  ) as {
    fonts: Record<string, FontFile[]>;
    fallbacks: {family: string; files: FontFile[]}[];
  };

  // The same faces in the same order as packages/render, so the animation and
  // the static export draw text with the same fallback chain.
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
  for (const {family, files} of manifest.fallbacks)
    await register(family, files);
  await register('Inter var', manifest.fonts.ui);
  const fontFamilies = manifest.fallbacks.map(({family}) => family);
  const appFonts = new Map<string, Promise<void>>();
  const registerAppFont = (fontId: string, family: string) => {
    if (!appFonts.has(fontId)) {
      appFonts.set(fontId, register(family, manifest.fonts[fontId]));
    }
    return appFonts.get(fontId)!;
  };

  // Copied from packages/render/src/render.ts, which A2 extends to animations.
  const gradientCorner =
    /(linear-gradient\(\s*)to (left|right) (top|bottom)\b/g;
  const normalizeGradients = (css: string) =>
    css.replace(gradientCorner, '$1to $3 $2');
  const htmlTag = /<!--[\s\S]*?-->|<[^>"]*(?:"[^"]*"[^>"]*)*>/g;
  const styleAttribute = /"[^"]*"|(\sstyle=")([^"]*")/g;
  const normalizeStyleAttributes = (html: string) =>
    html.replace(htmlTag, tag =>
      tag.replace(styleAttribute, (match, name?: string, value?: string) =>
        name && value ? name + normalizeGradients(value) : match,
      ),
    );
  // The CodeMirror rules come first, as on the web, so marks.css can show
  // the bands that reach out of the gutter and the scroller.
  const pageCss = (css: string) => [css, stylesheet].map(normalizeGradients);

  const decode = (bytes: Uint8Array) => PNG.sync.read(Buffer.from(bytes));

  // packages/render renders only the first tab, so later steps go through the
  // same measure, size and render calls with their tab active. Step one checks
  // that this path draws what renderSnapshot draws.
  async function staticExport(document: Document, editorId: string) {
    const {scale} = document;
    const frame = await entry.renderFrame(document, editorId);
    await registerAppFont(document.editor.options.fontId, frame.fontFamily);
    const html = normalizeStyleAttributes(frame.html);
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
    const layout = target?.size ?? {
      width: Math.max(document.width ?? 0, natural.width),
      height: natural.height,
    };
    return decode(
      await renderer.render(html, {
        width: Math.floor(Math.round(layout.width) * scale),
        height: Math.floor(Math.round(layout.height) * scale),
        css: [...css, entry.frameSizeCss(layout), target?.css ?? ''],
        fontFamilies,
        format: 'png',
        devicePixelRatio: scale,
      }),
    );
  }

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

  const measureAt =
    (scale: number) =>
    async (html: string, css: string): Promise<Measured> =>
      inCssPixels(
        await renderer.measure(normalizeStyleAttributes(html), {
          css: pageCss(css),
          fontFamilies,
          devicePixelRatio: scale,
        }),
        scale,
      );

  type Run = Measured['runs'][number];
  type Glyph = {char: string; x: number | null; y: number; slack: number};
  const LAYOUT_TOLERANCE = 0.5;
  // Takumi starts each text run of a static line where the run before it
  // ends, rounded up to 1/64 of a device pixel. The animation puts each token
  // on its exact cell, so a glyph may sit that much further right in the hold
  // for every run before it on its line.
  const RUN_DRIFT = 1 / 64 / Number(args.scale);
  // Five times the largest distance a hold glyph has from its match in any
  // case, 0.031.
  const GLYPH_TOLERANCE = 0.15;
  const near = (a: number, b: number) => Math.abs(a - b) <= LAYOUT_TOLERANCE;
  const sameBox = (a: Measured, b: Measured) =>
    near(a.width, b.width) &&
    near(a.height, b.height) &&
    a.transform.every((value, index) =>
      index < 4
        ? Math.abs(value - b.transform[index]) < 1e-3
        : near(value, b.transform[index]),
    );
  const box = (node: Measured) =>
    `${node.width.toFixed(1)}x${node.height.toFixed(1)} at ${node.transform[4].toFixed(1)},${node.transform[5].toFixed(1)}`;
  const runsOf = (node: Measured): [Measured, Run][] => [
    ...node.runs.map(run => [node, run] as [Measured, Run]),
    ...node.children.flatMap(runsOf),
  ];
  const textOf = (node: Measured) =>
    runsOf(node)
      .map(([, run]) => run.text)
      .join('')
      .replace(/\s/g, '');

  // A run of printable ASCII splits into equal cells. In any other run only
  // the first character has a known column. `shift` moves every glyph.
  const glyphsOf = (nodes: Measured[], shift = 0): Glyph[] =>
    nodes.flatMap(runsOf).flatMap(([node, run]) => {
      const [a, b, c, d, e, f] = node.transform;
      const chars = [...run.text];
      const ascii = /^[ -~]*$/.test(run.text);
      const slack = node.runs.indexOf(run) * RUN_DRIFT;
      return chars.flatMap((char, index) => {
        if (/\s/.test(char)) return [];
        const x = run.x + (index * run.width) / chars.length;
        return [
          {
            char,
            x: ascii || index === 0 ? a * x + c * run.y + e + shift : null,
            y: b * x + d * run.y + f,
            slack,
          },
        ];
      });
    });

  // Takumi places a node by its border box and its runs from its content
  // box, so the runs of a hold line read the line's left padding too far
  // left. An empty inline block first in each line and gutter element of a
  // hold marks where its text starts.
  const markLineStarts = (html: string) =>
    html.replace(
      /<div class="cm-(?:line|gutterElement)\b[^>]*>/g,
      tag => `${tag}<span style="display:inline-block"></span>`,
    );
  const isEmpty = (node: Measured) =>
    !node.width && !node.height && !node.runs.length && !node.children.length;
  const emptyNodes = (node: Measured): Measured[] => [
    ...(isEmpty(node) ? [node] : []),
    ...node.children.flatMap(emptyNodes),
  ];

  // A marked line draws its band into the window inset with pseudo-elements.
  // Takumi then wraps the text in an anonymous box, and the band leaves an
  // empty node where the text ends, so the marker is the leftmost empty node.
  function lineGlyphs(lines: Measured[]): Glyph[] {
    return lines.flatMap(line => {
      const [start] = emptyNodes(line).sort(
        (a, b) => a.transform[4] - b.transform[4],
      );
      if (!start) {
        throw new Error(`no line start before "${textOf(line)}"`);
      }
      const [first] = runsOf(line);
      if (!first) return [];
      const [node, run] = first;
      const [a, , c, , e] = node.transform;
      return glyphsOf([line], start.transform[4] - (a * run.x + c * run.y + e));
    });
  }

  const missingGlyph = (expected: Glyph[], actual: Glyph[]) =>
    expected.find(
      want =>
        !actual.some(
          got =>
            got.char === want.char &&
            near(got.y, want.y) &&
            (want.x === null ||
              (got.x !== null &&
                Math.abs(got.x - want.x) <= GLYPH_TOLERANCE + want.slack)),
        ),
    );

  const lineCount = (code: string) => code.split(/\r\n|\r|\n/).length;

  // The path from the page of a hold scene to its code box, the box with one
  // child per line that holds the text of `code`. An empty tab has no text to
  // find it by.
  function codeBoxPath(hold: Measured, code: string): number[] | null {
    const lines = lineCount(code);
    const text = code.replace(/\s/g, '');
    const search = (node: Measured, path: number[]): number[] | null => {
      for (const [index, child] of node.children.entries()) {
        const found = search(child, [...path, index]);
        if (found) return found;
      }
      return node.children.length === lines && textOf(node) === text
        ? path
        : null;
    };
    return text ? search(hold, []) : null;
  }

  // Compares the first or last frame of a transition with the hold scene of
  // the same step: every box from the page down to the code box at `path`,
  // the gutter, and every character the hold shows. Tokens the transition
  // hides are extra and allowed. The hold has its line starts marked.
  function layoutJump(hold: Measured, frame: Measured, path: number[]) {
    const pairs: [Measured, Measured][] = [[hold, frame]];
    for (const index of path) {
      const [a, b] = pairs.at(-1)!;
      if (!b.children[index]) return `no node ${path.join('.')}`;
      pairs.push([a.children[index], b.children[index]]);
    }
    const moved = pairs.findIndex(([a, b]) => !sameBox(a, b));
    if (moved >= 0) {
      const [a, b] = pairs[moved];
      return `box ${path.slice(0, moved).join('.')} ${box(a)} > ${box(b)}`;
    }
    const [[holdScroller, frameScroller], [holdCode, frameCode]] =
      pairs.slice(-2);
    const layers: [string, Measured[], Measured[]][] = [
      ['code', holdCode.children, [frameCode]],
    ];
    if (holdScroller.children.length === 2) {
      const [holdGutter] = holdScroller.children;
      const [frameGutter] = frameScroller.children;
      if (!sameBox(holdGutter, frameGutter)) {
        return `gutter ${box(holdGutter)} > ${box(frameGutter)}`;
      }
      // The first gutter element is the hidden spacer that sizes the gutter.
      layers.push([
        'gutter',
        holdGutter.children[0].children.slice(1),
        [frameGutter],
      ]);
    }
    for (const [layer, lines, to] of layers) {
      const missing = missingGlyph(lineGlyphs(lines), glyphsOf(to));
      if (missing) {
        return `${layer} "${missing.char}" at ${missing.x?.toFixed(1) ?? '?'},${missing.y.toFixed(1)} has no match`;
      }
    }
    return null;
  }

  type Rect = {x: number; y: number; width: number; height: number};
  type Point = {x: number; y: number};

  function fromSegment(point: Point, start: Point, end: Point) {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const length = dx * dx + dy * dy;
    const along = length
      ? Math.min(
          1,
          Math.max(
            0,
            ((point.x - start.x) * dx + (point.y - start.y) * dy) / length,
          ),
        )
      : 0;
    return Math.hypot(
      point.x - (start.x + along * dx),
      point.y - (start.y + along * dy),
    );
  }

  // Each code row of a hold scene, gutter included, in CSS pixels.
  function codeRows(hold: Measured, path: number[]): Rect[] {
    const nodes = path.reduce(
      (nodes, index) => [...nodes, nodes.at(-1)!.children[index]],
      [hold],
    );
    const [scroller, codeBox] = nodes.slice(-2);
    return codeBox.children.map(line => ({
      x: scroller.transform[4],
      y: line.transform[5],
      width: scroller.width * scroller.transform[0],
      height: line.height * line.transform[3],
    }));
  }

  // How far the mean color of each row moves between two images, in 8-bit
  // levels. Antialiasing moves ink between neighboring pixels and keeps the
  // mean. A token that should be hidden, a missing mark or diff sign, and a
  // wrong dim opacity change it, and all of them stay under the pixel limit.
  function paintShifts(a: PNG, b: PNG, rows: Rect[]) {
    return rows.map(row => {
      const left = Math.max(0, Math.round(row.x));
      const top = Math.max(0, Math.round(row.y));
      const right = Math.min(a.width, Math.round(row.x + row.width));
      const bottom = Math.min(a.height, Math.round(row.y + row.height));
      const sums = [0, 0, 0];
      for (let y = top; y < bottom; y++) {
        for (let x = left; x < right; x++) {
          const at = (y * a.width + x) * 4;
          for (const channel of [0, 1, 2]) {
            sums[channel] += a.data[at + channel] - b.data[at + channel];
          }
        }
      }
      const pixels = (right - left) * (bottom - top);
      // A row outside the image has nothing to compare, which is a failure.
      return pixels > 0
        ? Math.max(...sums.map(sum => Math.abs(sum) / pixels))
        : Infinity;
    });
  }

  // Five times the largest shift a matching row has in any case, 0.010.
  const PAINT_TOLERANCE = 0.05;
  // The static view fades a dimmed line and its mark as one group. The
  // animation fades the mark and each token apart, so the mark shows through
  // the text and draws it up to 3 levels lighter.
  const DIMMED_MARK_TOLERANCE = 0.5;

  // A hold sits on whole pixels, so its center may be 0.5 px off for an odd
  // margin and 0.25 px more for a width that was rounded to place it.
  const CENTER_TOLERANCE = 0.75;
  // Takumi truncates lengths to 1/64 of a device pixel, so a window that
  // fills the padding may cross it by that much.
  const WINDOW_OUT_TOLERANCE = 1 / 64;

  type Marks = {lines: {line: number}[]; focusedLines: number[]};

  // The rows that focus dims and that carry a mark, 0-based.
  function dimmedMarks(code: string, marks: Marks | undefined) {
    const inCode = (line: number) => line >= 1 && line <= lineCount(code);
    const focused = marks?.focusedLines.filter(inCode) ?? [];
    return new Set(
      marks && focused.length
        ? marks.lines
            .map(mark => mark.line)
            .filter(line => inCode(line) && !focused.includes(line))
            .map(line => line - 1)
        : [],
    );
  }

  function crop(
    image: PNG,
    x: number,
    y: number,
    width: number,
    height: number,
  ) {
    const cropped = new PNG({width, height});
    PNG.bitblt(image, cropped, x, y, width, height, 0, 0);
    return cropped;
  }

  // Writes the diff image of a nonzero cell, since a cell under the limit can
  // still hide a missing element.
  async function diffPercent(a: PNG, b: PNG, diffPath?: string) {
    if (a.width !== b.width || a.height !== b.height) return Infinity;
    const diff = new PNG({width: a.width, height: a.height});
    const pixels = pixelmatch(a.data, b.data, diff.data, a.width, a.height, {
      threshold: PIXELMATCH_THRESHOLD,
    });
    if (pixels && diffPath) await writeFile(diffPath, PNG.sync.write(diff));
    return (pixels / (a.width * a.height)) * 100;
  }

  function sideBySide(images: PNG[], gap: number) {
    const width =
      images.reduce((sum, image) => sum + image.width, 0) +
      gap * (images.length - 1);
    const height = Math.max(...images.map(image => image.height));
    const sheet = new PNG({width, height});
    sheet.data.fill(255);
    let x = 0;
    for (const image of images) {
      PNG.bitblt(image, sheet, 0, 0, image.width, image.height, x, 0);
      x += image.width + gap;
    }
    return sheet;
  }

  const BASE: SnapshotInput = {
    $version: '1.10.0',
    $snippetId: null,
    format: 'png',
    scale: Number(args.scale),
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
    editor: {
      options: {
        fontId: 'jetbrains-mono',
        fontWeight: 400,
        showLineNumbers: false,
        themeId: 'dracula',
        enableLigatures: true,
      },
      editors: [],
    },
  };

  type Tab = {code: string; marks?: unknown; lineNumberStart?: number};
  type Overrides = {
    options?: Partial<SnapshotInput['editor']['options']>;
    terminal?: Record<string, unknown>;
    frame?: Record<string, unknown>;
    width?: number;
    languageId?: string;
    tabNames?: [string, string];
  };

  function pair(from: Tab, to: Tab, overrides: Overrides = {}): SnapshotInput {
    const tab = (
      id: string,
      tabName: string,
      {code, marks, lineNumberStart}: Tab,
    ) => ({
      id,
      code,
      tabName,
      languageId: overrides.languageId ?? 'typescript',
      lineNumberStart: lineNumberStart ?? 1,
      ...(marks ? {marks} : {}),
    });
    return {
      ...BASE,
      ...(overrides.width ? {width: overrides.width} : {}),
      frame: {...BASE.frame, ...overrides.frame},
      terminal: {...BASE.terminal, ...overrides.terminal},
      editor: {
        options: {...BASE.editor.options, ...overrides.options},
        editors: [
          tab('a', overrides.tabNames?.[0] ?? 'before.ts', from),
          tab('b', overrides.tabNames?.[1] ?? 'after.ts', to),
        ],
      },
    } as SnapshotInput;
  }

  const RENAME_FROM = `function computeTotal(items: number[]) {
    return items.reduce((sum, item) => sum + item, 0);
  }

  console.log(computeTotal([1, 2, 3]));`;
  const SHORT = `const greeting = 'hello';
  console.log(greeting);`;
  const EIGHT = Array.from(
    {length: 8},
    (_, index) => `const value${index} = ${index};`,
  ).join('\n');
  const LIGATURES_FROM = `const same = (a, b) => a === b;
  const ok = list.filter(x => x !== null);`;
  const LIGATURES_TO = `const same = (a: number, b: number) => a === b;
  const ok = list.filter(x => x !== null && x >= 0);`;
  const FALLBACK_FROM = `// 你好，世界 👋
  const hello = 'world';`;
  const FALLBACK_TO = `// 你好，世界 👋 こんにちは
  const hello = 'world';
  const answer = 42;`;

  const CROSS_FROM = `const total = items.length * 2;
const label = 'short';`;
  const CROSS_TO = `const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0) * taxRate;
const label = 'a much longer label that pushes the code past the width of the tab header';`;

  // Two lines, the second over 200 characters, that a target frame scales
  // down to fit.
  const LONG_LINES = `${CROSS_TO} ${CROSS_TO.replace('\n', ' ')}`;
  const numbered = (rows: number, value: (index: number) => string) =>
    Array.from(
      {length: rows},
      (_, index) => `const line${index} = ${value(index)};`,
    ).join('\n');

  // Rows of 80 repeating digits give each glyph many twins on its line.
  const grid = (rows: number) =>
    `const grid = [\n${Array.from({length: rows}, (_, row) => `  [${Array.from({length: 80}, (_, index) => (row * 7 + index) % 10).join(', ')}],`).join('\n')}\n];`;

  const cases: {name: string; input: SnapshotInput; identity?: boolean}[] = [
    {
      name: 'rename',
      input: pair(
        {code: RENAME_FROM},
        {code: RENAME_FROM.replaceAll('computeTotal', 'sumItems')},
      ),
    },
    {
      name: 'grow',
      input: pair(
        {code: SHORT},
        {
          code: `${SHORT}\n${Array.from({length: 20}, (_, index) => `const line${index} = greeting.length * ${index};`).join('\n')}`,
        },
      ),
    },
    {
      name: 'gutter',
      input: pair(
        {code: EIGHT},
        {code: `import {a} from 'a';\nimport {b} from 'b';\n\n${EIGHT}`},
        {options: {showLineNumbers: true}},
      ),
    },
    {
      name: 'marks',
      input: pair(
        {
          code: RENAME_FROM,
          marks: {
            lines: [
              {line: 2, kind: 'added'},
              {line: 5, kind: 'highlight'},
            ],
            focusedLines: [],
          },
        },
        {
          code: `// totals\n${RENAME_FROM}`,
          marks: {
            lines: [
              {line: 1, kind: 'removed'},
              {line: 3, kind: 'added'},
            ],
            focusedLines: [],
          },
        },
        {options: {showLineNumbers: true}},
      ),
    },
    {
      name: 'focus',
      input: pair(
        {
          code: RENAME_FROM,
          marks: {lines: [{line: 2, kind: 'highlight'}], focusedLines: [2]},
        },
        {
          code: `// totals\n${RENAME_FROM}`,
          marks: {lines: [{line: 3, kind: 'highlight'}], focusedLines: [3]},
        },
        {options: {showLineNumbers: true}},
      ),
    },
    {
      name: 'ligatures',
      input: pair(
        {code: LIGATURES_FROM},
        {code: LIGATURES_TO},
        {
          options: {fontId: 'geist-mono', enableLigatures: true},
        },
      ),
    },
    {
      name: 'ligatures-off',
      input: pair(
        {code: LIGATURES_FROM},
        {code: LIGATURES_TO},
        {
          options: {fontId: 'geist-mono', enableLigatures: false},
        },
      ),
    },
    {name: 'fallback', input: pair({code: FALLBACK_FROM}, {code: FALLBACK_TO})},
    ...[
      'dracula',
      'githubLight',
      'fleetDark',
      'nightOwlTheme',
      'synthwave84',
    ].map(themeId => ({
      name: `theme-${themeId}`,
      input: pair(
        {code: RENAME_FROM},
        {
          code: `// totals\n${RENAME_FROM.replaceAll('computeTotal', 'sumItems')}`,
        },
        {
          options: {themeId, showLineNumbers: true},
          // Empty colors take the theme's own terminal colors.
          terminal: {background: '', textColor: ''},
        },
      ),
    })),
    ...['macOs', 'windows', 'macOsGrayTheme', 'macOsOutlineTheme'].map(
      type => ({
        name: `terminal-${type}`,
        input: pair(
          {code: SHORT},
          {code: `${SHORT}\nconsole.log(greeting.length);`},
          {
            terminal: {type},
          },
        ),
      }),
    ),
    {
      name: 'identity',
      input: pair(
        {code: RENAME_FROM},
        {code: RENAME_FROM},
        {options: {showLineNumbers: true}},
      ),
      identity: true,
    },
    {
      name: 'edge-escape',
      input: pair(
        {code: 'const a = x < 1 && y > 2;\nconst tag = "<b>&amp;</b>";'},
        {
          code: 'const a = x < 1 && y > 2 || z;\nconst tag = "<i>&lt;</i>";\nconst q = \'"\';',
        },
      ),
    },
    {
      name: 'edge-crlf',
      input: pair(
        {code: 'const a = 1;\r\nconst b = 2;\r\n'},
        {code: 'const a = 1;\r\nconst c = 3;\r\nconst b = 2;\r\n'},
        {options: {showLineNumbers: true}},
      ),
    },
    {
      name: 'edge-tabs',
      input: pair(
        {code: 'function f() {\n\treturn 1;\n}'},
        {code: 'function f() {\n\tconst a\t= 2;\n\t\treturn a;\t// done\n}'},
      ),
    },
    {
      name: 'edge-empty-from',
      input: pair(
        {code: ''},
        {code: SHORT},
        {options: {showLineNumbers: true}},
      ),
    },
    {
      name: 'edge-empty-to',
      input: pair(
        {code: SHORT},
        {code: ''},
        {options: {showLineNumbers: true}},
      ),
    },
    {
      name: 'edge-blank-lines',
      input: pair({code: 'a;\n\nb;\n'}, {code: 'a;\n\n\n  \nb;\n\n'}),
    },
    {
      name: 'edge-long-line',
      input: pair(
        {code: SHORT},
        {
          code: `${SHORT}\nconst long = [${Array.from({length: 60}, (_, index) => `'item${index}'`).join(', ')}];`,
        },
      ),
    },
    {
      name: 'edge-line-2000',
      input: pair(
        {code: SHORT},
        {
          code: `${SHORT}\nconst longer = [${Array.from({length: 248}, (_, index) => `'v${String(index).padStart(3, '0')}'`).join(', ')}];`,
        },
      ),
    },
    {
      name: 'edge-periodic',
      input: pair({code: grid(8)}, {code: grid(20)}),
    },
    {
      name: 'edge-header-cross',
      input: pair(
        {code: CROSS_FROM},
        {code: CROSS_TO},
        {tabNames: ['animation-before-the-change.ts', 'animation-after.ts']},
      ),
    },
    {
      name: 'edge-glyph-tab',
      input: pair(
        {code: `const a = '世';`},
        {code: `const a = '世界';\nconst b = '界';`},
        {tabNames: ['世', '界']},
      ),
    },
    {
      name: 'edge-target',
      input: pair(
        {code: SHORT},
        {
          code: `${SHORT}\n${Array.from({length: 20}, (_, index) => `const line${index} = greeting.length * ${index};`).join('\n')}`,
        },
        {frame: {exportTarget: 'x-landscape'}},
      ),
    },
    {
      name: 'edge-target-scale',
      input: pair(
        {code: SHORT},
        {code: numbered(45, index => `greeting.length * ${index}`)},
        {frame: {exportTarget: 'x-landscape'}},
      ),
    },
    {
      name: 'edge-target-scale-wide',
      input: pair(
        {code: 'const a = 1;'},
        {code: LONG_LINES},
        {frame: {exportTarget: 'square'}},
      ),
    },
    {
      name: 'edge-target-scale-both',
      input: pair(
        {code: numbered(60, index => `${index}`)},
        {code: LONG_LINES},
        {frame: {exportTarget: 'square'}},
      ),
    },
    {
      name: 'edge-width',
      input: pair(
        {code: SHORT},
        {code: `${SHORT}\nconsole.log(greeting.length);`},
        {width: 900},
      ),
    },
    {
      name: 'edge-recolor',
      input: pair(
        {code: 'const x = foo;\nconst y = bar.baz;'},
        {code: '// call\nconst x = foo();\nconst y = bar.baz();'},
      ),
    },
    {
      name: 'edge-focus-diff',
      input: pair(
        {
          code: RENAME_FROM,
          marks: {
            lines: [
              {line: 1, kind: 'added'},
              {line: 2, kind: 'highlight'},
              {line: 3, kind: 'removed'},
            ],
            focusedLines: [2],
          },
        },
        {
          code: `// totals\n${RENAME_FROM}`,
          marks: {
            lines: [
              {line: 2, kind: 'added'},
              {line: 3, kind: 'highlight'},
            ],
            focusedLines: [3],
          },
        },
        {options: {showLineNumbers: true}},
      ),
    },
    {
      name: 'edge-mark-edit',
      input: pair(
        {
          code: RENAME_FROM,
          marks: {lines: [{line: 2, kind: 'highlight'}], focusedLines: [2]},
        },
        {
          code: RENAME_FROM.replace('sum + item', 'sum + item * 2'),
          marks: {lines: [{line: 2, kind: 'highlight'}], focusedLines: [2]},
        },
      ),
    },
    {
      name: 'edge-focus-change',
      input: pair(
        {
          code: RENAME_FROM,
          marks: {
            lines: [
              {line: 2, kind: 'highlight'},
              {line: 5, kind: 'added'},
            ],
            focusedLines: [1, 2],
          },
        },
        {
          code: `// totals\n${RENAME_FROM}`,
          marks: {
            lines: [
              {line: 3, kind: 'highlight'},
              {line: 6, kind: 'added'},
            ],
            focusedLines: [5, 6],
          },
        },
        {options: {showLineNumbers: true}},
      ),
    },
    {
      name: 'edge-focus-off',
      input: pair(
        {
          code: RENAME_FROM,
          marks: {lines: [{line: 2, kind: 'highlight'}], focusedLines: [5]},
        },
        {
          code: RENAME_FROM,
          marks: {lines: [{line: 2, kind: 'highlight'}], focusedLines: []},
        },
        {options: {showLineNumbers: true}},
      ),
    },
    {
      name: 'edge-line-start',
      input: pair(
        {code: EIGHT, lineNumberStart: 1},
        {code: EIGHT, lineNumberStart: 98},
        {options: {showLineNumbers: true}},
      ),
    },
    {
      name: 'edge-plain-text',
      input: pair(
        {code: 'hello   world\n  indented <tag> & more'},
        {code: 'hello world\nnew line\n  indented <tag> & more'},
        {languageId: 'plain-text'},
      ),
    },
    ...[false, true].map(showLineNumbers => ({
      name: `edge-plain-blank-${showLineNumbers ? 'gutter' : 'lines'}`,
      input: pair(
        {code: 'alpha\n\nbeta\n\ngamma'},
        {code: 'alpha\n\n\nbeta\n\ngamma\n\ndelta'},
        {languageId: 'plain-text', options: {showLineNumbers}},
      ),
    })),
  ];

  const settings: Settings = {
    steps: [
      {editorId: 'a', holdMs: 500},
      {editorId: 'b', holdMs: 500},
    ],
    transitionMs: 900,
    easing: 'smooth',
    fps: 30,
  };

  await mkdir(out, {recursive: true});
  const selected = args.case?.length
    ? cases.filter(({name}) => args.case!.includes(name))
    : cases;
  const rows: Record<string, unknown>[] = [];
  let failed = false;
  for (const {name, input, identity} of selected) {
    const document = parseSnapshotDocument(input);
    const {scale} = document;
    const [first, second] = document.editor.editors.map(({id}) => id);
    const fromStatic = await staticExport(document, first);
    const toStatic = await staticExport(document, second);
    const reference = await diffPercent(
      decode((await renderSnapshot(input)) as Uint8Array),
      fromStatic,
    );
    const animation = await entry.renderAnimationScenes(
      document,
      settings,
      measureAt(scale),
    );
    const [fromHold, early, late, toHold] = animation.scenes;
    if (args.shift) {
      const [layer, pixels] = args.shift.split(':');
      const moved = {
        code: '.cm-content > .cm-line > div:last-child',
        gutter: '.cm-gutterElement > div',
      }[layer];
      if (!moved) throw new Error(`cannot shift ${layer}`);
      animation.css += `\n[data-animation-scene="1"] ${moved}{left:${pixels}px}`;
    }
    const frameAt = async (scene: {html: string}, timeMs: number) =>
      decode(
        await renderer.render(normalizeStyleAttributes(scene.html), {
          width: animation.width * scale,
          height: animation.height * scale,
          css: pageCss(animation.css),
          fontFamilies,
          format: 'png',
          devicePixelRatio: scale,
          timeMs,
        }),
      );
    // Where the static export of a step sits in the video, in device pixels.
    const origin = (reference: PNG) => ({
      x: Math.floor((animation.width - reference.width / scale) / 2) * scale,
      y: Math.floor((animation.height - reference.height / scale) / 2) * scale,
    });
    const centered = (frame: PNG, reference: PNG) => {
      const {x, y} = origin(reference);
      return crop(frame, x, y, reference.width, reference.height);
    };
    const layoutAt = async (scene: {html: string}, timeMs: number) =>
      inCssPixels(
        await renderer.measure(normalizeStyleAttributes(scene.html), {
          width: animation.width * scale,
          height: animation.height * scale,
          css: pageCss(animation.css),
          fontFamilies,
          devicePixelRatio: scale,
          timeMs,
        }),
        scale,
      );
    // html > body > scene > preview wrapper > frame
    const frameOf = async (scene: {html: string}, timeMs: number) =>
      (await layoutAt(scene, timeMs)).children[0].children[0].children[0]
        .children[0];
    const frameSize = async (scene: {html: string}, timeMs: number) => {
      const frame = await frameOf(scene, timeMs);
      return `${Math.round(frame.width)}x${Math.round(frame.height)}`;
    };
    const [from, to] = document.editor.editors;
    const fromLayout = await layoutAt(fromHold, 0);
    const toLayout = await layoutAt(toHold, 0);
    // Both steps share one frame, so one path leads to the code box of both.
    const path =
      codeBoxPath(fromLayout, from.code) ?? codeBoxPath(toLayout, to.code);
    // The box a target frame shows its window in, after its scale. The
    // window is the child of the frame on the path to the code box.
    const windowOf = (frame: Measured): Rect | null => {
      if (!document.frame.exportTarget || !path) return null;
      const window = frame.children[path[4]];
      const [a, , , d, x, y] = window.transform;
      return {
        x: x - frame.transform[4],
        y: y - frame.transform[5],
        width: window.width * a,
        height: window.height * d,
      };
    };
    // How far the center of the frame is from the center of the video, at
    // eight times of the transition and its end. In a target frame, also
    // where its window is.
    let center = 0;
    const windows: Rect[] = [];
    for (const scene of [early, late]) {
      for (let step = 0; step <= 4; step++) {
        const frame = await frameOf(
          scene,
          Math.round((step * scene.durationMs) / 4),
        );
        center = Math.max(
          center,
          Math.abs(frame.transform[4] + frame.width / 2 - animation.width / 2),
          Math.abs(
            frame.transform[5] + frame.height / 2 - animation.height / 2,
          ),
        );
        const window = windowOf(frame);
        if (window) windows.push(window);
      }
    }
    // How far the window's center strays from the line between its two
    // ends, and how far the window reaches into the padding of its frame.
    const middle = (box: Rect) => ({
      x: box.x + box.width / 2,
      y: box.y + box.height / 2,
    });
    const padding = document.frame.padding;
    const windowDrift = Math.max(
      0,
      ...windows.map(box =>
        fromSegment(middle(box), middle(windows[0]), middle(windows.at(-1)!)),
      ),
    );
    const windowOut = Math.max(
      0,
      ...windows.flatMap(box => [
        padding - box.x,
        padding - box.y,
        box.x + box.width - (animation.width - padding),
        box.y + box.height - (animation.height - padding),
      ]),
    );
    const markedHold = (scene: {html: string}) =>
      layoutAt({html: markLineStarts(scene.html)}, 0);
    const layout = path
      ? (layoutJump(
          await markedHold(fromHold),
          await layoutAt(early, 0),
          path,
        ) ??
        layoutJump(
          await markedHold(toHold),
          await layoutAt(late, late.durationMs),
          path,
        ))
      : 'no code box in a hold scene';
    const frames = [
      await frameSize(early, 0),
      await frameSize(late, 0),
      await frameSize(late, late.durationMs),
    ].join(' > ');
    const start = await frameAt(early, 0);
    const halfway = await frameAt(late, 0);
    const quarters = [
      await frameAt(early, Math.round(early.durationMs / 2)),
      await frameAt(late, Math.round(late.durationMs / 2)),
    ];
    const end = await frameAt(late, late.durationMs);
    const startDiff = await diffPercent(
      centered(start, fromStatic),
      fromStatic,
      join(out, `${name}-start-diff.png`),
    );
    const endDiff = await diffPercent(
      centered(end, toStatic),
      toStatic,
      join(out, `${name}-end-diff.png`),
    );
    const paintJump = (
      frame: PNG,
      reference: PNG,
      hold: Measured,
      {code, marks}: typeof from,
    ) => {
      const {x, y} = origin(reference);
      const rows = path ? codeRows(hold, path) : [];
      const shifts = paintShifts(
        centered(frame, reference),
        reference,
        rows.map(row => ({
          x: row.x * scale - x,
          y: row.y * scale - y,
          width: row.width * scale,
          height: row.height * scale,
        })),
      );
      const loose = dimmedMarks(code, marks);
      const row = shifts.findIndex(
        (shift, row) =>
          shift > (loose.has(row) ? DIMMED_MARK_TOLERANCE : PAINT_TOLERANCE),
      );
      return row < 0
        ? null
        : `row ${row + 1} moved ${shifts[row].toFixed(3)} levels`;
    };
    const paint =
      paintJump(start, fromStatic, fromLayout, from) ??
      paintJump(end, toStatic, toLayout, to);
    let worstFrame = Math.max(startDiff, endDiff);
    if (identity) {
      // The second half shows the second tab as active.
      for (const [scene, reference] of [
        [early, fromStatic],
        [late, toStatic],
      ] as const) {
        for (let t = 0; t <= scene.durationMs; t += 1000 / settings.fps) {
          const frame = await frameAt(scene, Math.round(t));
          worstFrame = Math.max(
            worstFrame,
            await diffPercent(centered(frame, reference), reference),
          );
        }
      }
    }
    await writeFile(
      join(out, `${name}.png`),
      PNG.sync.write(
        sideBySide([start, quarters[0], halfway, quarters[1], end], 16 * scale),
      ),
    );
    await writeFile(
      join(out, `${name}-from-static.png`),
      PNG.sync.write(fromStatic),
    );
    await writeFile(
      join(out, `${name}-to-static.png`),
      PNG.sync.write(toStatic),
    );
    const encoded: Record<string, string> = {};
    if (args.encode) {
      // Takumi samples frame k at k * 1000 / fps on the timeline of all
      // scenes, and WebP and GIF merge repeated frames into longer ones.
      // Each decoded frame is rendered directly at its start and compared.
      const sceneAt = (ms: number) => {
        let start = 0;
        for (const scene of animation.scenes) {
          if (ms < start + scene.durationMs) return {scene, timeMs: ms - start};
          start += scene.durationMs;
        }
        const last = animation.scenes.at(-1)!;
        return {scene: last, timeMs: last.durationMs};
      };
      for (const format of ['webp', 'gif', 'apng'] as const) {
        const fps = format === 'gif' ? 50 : settings.fps;
        const file = join(out, `${name}.${format}`);
        await writeFile(
          file,
          await renderer.renderAnimation({
            scenes: animation.scenes.map(({html, durationMs}) => ({
              node: normalizeStyleAttributes(html),
              durationMs,
            })),
            width: animation.width * scale,
            height: animation.height * scale,
            css: pageCss(animation.css),
            fontFamilies,
            fps,
            format,
            devicePixelRatio: scale,
          }),
        );
        const decoded = await decodeAnimation(file);
        let worst = 0;
        for (const index of [
          0,
          Math.floor(decoded.frames.length / 2),
          decoded.frames.length - 1,
        ]) {
          const sample = Math.round(
            (decoded.frames[index].startMs * fps) / 1000,
          );
          const {scene, timeMs} = sceneAt(Math.round((sample * 1000) / fps));
          worst = Math.max(
            worst,
            await diffPercent(
              decoded.frames[index].png,
              await frameAt(scene, timeMs),
            ),
          );
        }
        encoded[format] = `${decoded.frames.length}f ${worst.toFixed(3)}`;
      }
    }
    const pass =
      layout === null &&
      paint === null &&
      center <= CENTER_TOLERANCE &&
      windowDrift <= CENTER_TOLERANCE &&
      windowOut <= WINDOW_OUT_TOLERANCE / scale &&
      reference === 0 &&
      startDiff <= MAX_DIFF_PERCENT &&
      endDiff <= MAX_DIFF_PERCENT &&
      worstFrame <= MAX_DIFF_PERCENT;
    failed ||= !pass;
    const row = {
      case: name,
      reference: reference.toFixed(3),
      start: startDiff.toFixed(3),
      end: endDiff.toFixed(3),
      layout: layout ?? 'ok',
      paint: paint ?? 'ok',
      center: center.toFixed(3),
      ...(windows.length
        ? {window: `${windowDrift.toFixed(3)} ${windowOut.toFixed(3)}`}
        : {}),
      ...(identity ? {worstFrame: worstFrame.toFixed(3)} : {}),
      size: `${animation.width}x${animation.height}`,
      frames,
      ...encoded,
      pass,
    };
    rows.push(row);
    console.log(JSON.stringify(row));
  }
  await writeFile(join(out, 'results.json'), JSON.stringify(rows, null, 2));
  console.table(rows);
  process.exitCode = failed ? 1 : 0;
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
