import {execFile} from 'node:child_process';
import {mkdir, readFile, rm, writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {promisify} from 'node:util';
import {parseArgs} from 'node:util';
import {chromium} from 'playwright';
import {PNG} from 'pngjs';
import type {SnapshotInput} from '../../packages/render/dist/index.mjs';
import {
  renderSnapshot,
  supportedFontIds,
  supportedThemeIds,
} from '../../packages/render/dist/index.mjs';
import {MAX_DIFF_PERCENT, PIXELMATCH_THRESHOLD} from './lib';
import pixelmatch from 'pixelmatch';

const {values: args} = parseArgs({
  options: {out: {type: 'string', default: '/tmp/codeimage-parity/live-p3'}},
});
const out = args.out;
const CODE = [
  'function Counter() {',
  '  const [count, setCount] = createSignal(0);',
  '  return <div>The count is {count()}</div>;',
  '}',
].join('\n');

function snapshot(
  overrides: {
    frame?: Record<string, unknown>;
    terminal?: Record<string, unknown>;
    options?: Record<string, unknown>;
    editor?: Record<string, unknown>;
  } = {},
  extra: Record<string, unknown> = {},
): SnapshotInput {
  return {
    $version: '1.10.0',
    $snippetId: null,
    format: 'png',
    scale: 1,
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
        themeId: 'vsCodeDarkTheme',
        enableLigatures: true,
        ...overrides.options,
      },
      editors: [
        {
          id: 'lane',
          code: CODE,
          tabName: 'index.tsx',
          languageId: 'typescript',
          lineNumberStart: 1,
          ...overrides.editor,
        },
      ],
    },
    ...extra,
  } as SnapshotInput;
}

const png = async (input: SnapshotInput) =>
  PNG.sync.read(Buffer.from((await renderSnapshot(input)) as Uint8Array));

function sheet(images: PNG[], columns: number): PNG {
  const gap = 16;
  const cellWidth = Math.max(...images.map(image => image.width));
  const cellHeight = Math.max(...images.map(image => image.height));
  const rows = Math.ceil(images.length / columns);
  const result = new PNG({
    width: columns * (cellWidth + gap) + gap,
    height: rows * (cellHeight + gap) + gap,
  });
  result.data.fill(255);
  images.forEach((image, index) => {
    const left = gap + (index % columns) * (cellWidth + gap);
    const top = gap + Math.floor(index / columns) * (cellHeight + gap);
    PNG.bitblt(image, result, 0, 0, image.width, image.height, left, top);
  });
  return result;
}

const save = (name: string, image: PNG) =>
  writeFile(join(out, name), PNG.sync.write(image));

function diffPercent(a: PNG, b: PNG) {
  if (a.width !== b.width || a.height !== b.height) return 100;
  const pixels = pixelmatch(a.data, b.data, null, a.width, a.height, {
    threshold: PIXELMATCH_THRESHOLD,
  });
  return (pixels / (a.width * a.height)) * 100;
}

function lastInkRow(image: PNG, from: number, to: number, reference: number) {
  for (let y = image.height - 1; y >= 0; y--) {
    const [r, g, b] = pixel(image, reference, y);
    for (let x = from; x < to; x++) {
      const [pr, pg, pb] = pixel(image, x, y);
      if (Math.abs(pr - r) + Math.abs(pg - g) + Math.abs(pb - b) > 60) return y;
    }
  }
  return -1;
}

function pixel(image: PNG, x: number, y: number) {
  const i = (y * image.width + x) * 4;
  return [...image.data.subarray(i, i + 4)];
}

async function lane<T>(name: string, run: () => Promise<T>) {
  try {
    const result = await run();
    console.log(name, JSON.stringify(result));
    return {lane: name, ...result};
  } catch (error) {
    console.log(name, 'ERROR', (error as Error).message);
    return {lane: name, pass: false, error: (error as Error).message};
  }
}

async function main() {
  await rm(out, {recursive: true, force: true});
  await mkdir(out, {recursive: true});
  const results = [];

  results.push(
    await lane('2 themes', async () => {
      const themes = await supportedThemeIds();
      const images = [];
      for (const themeId of themes) {
        images.push(await png(snapshot({options: {themeId}})));
      }
      await save('p3-themes.png', sheet(images, 6));
      return {
        pass: images.length === themes.length,
        themes: themes.length,
        note: 'per-theme parity is the takumi-vs-chrome table',
      };
    }),
  );

  results.push(
    await lane('3 background image', async () => {
      const tile = new PNG({width: 64, height: 64});
      for (let y = 0; y < 64; y++) {
        for (let x = 0; x < 64; x++) {
          const i = (y * 64 + x) * 4;
          tile.data.set([x * 4, 40, y * 4, 255], i);
        }
      }
      const dataUrl = `data:image/png;base64,${PNG.sync.write(tile).toString('base64')}`;
      const image = await png(
        snapshot({frame: {background: `link:${dataUrl}`}}),
      );
      await save('p3-bg-image.png', image);
      const topLeft = pixel(image, 4, 4);
      const bottomRight = pixel(image, image.width - 5, image.height - 5);
      const asset = await renderSnapshot(
        snapshot({frame: {background: 'asset:local-upload'}}),
      ).catch((error: Error) => error.message);
      return {
        pass:
          topLeft[1] === 40 &&
          bottomRight[1] === 40 &&
          bottomRight[0] > topLeft[0] &&
          String(asset).includes('asset:local-upload'),
        topLeft,
        bottomRight,
        browserAsset: asset,
      };
    }),
  );

  results.push(
    await lane('4 emoji and CJK', async () => {
      const text = (code: string) =>
        png(snapshot({editor: {code}, terminal: {showWatermark: false}}));
      const [cjk, boxes, blank, emoji] = await Promise.all([
        text('const 你好 = "世界";'),
        text('const \uE000\uE001 = "\uE002\uE003";'),
        text('const    = "  ";'),
        text('const ok = "🎉🚀";'),
      ]);
      await save('p3-fallback.png', sheet([cjk, emoji], 1));
      const ink = (image: PNG) =>
        pixelmatch(image.data, blank.data, null, image.width, image.height, {
          threshold: PIXELMATCH_THRESHOLD,
        });
      const colored = (image: PNG) => {
        let count = 0;
        for (let i = 0; i < image.data.length; i += 4) {
          const [r, g, b] = image.data.subarray(i, i + 3);
          if (Math.max(r, g, b) - Math.min(r, g, b) > 150) count++;
        }
        return count;
      };
      const cjkInk = ink(cjk);
      const boxInk = ink(boxes);
      const emojiColor = colored(emoji) - colored(blank);
      return {
        pass: cjkInk > boxInk * 1.2 && emojiColor > 20,
        cjkInk,
        missingGlyphBoxInk: boxInk,
        emojiColoredPixels: emojiColor,
      };
    }),
  );

  results.push(
    await lane('5 svg', async () => {
      const document = snapshot({}, {format: 'svg'});
      const svg = (await renderSnapshot(document)) as string;
      const svgPath = join(out, 'p3.svg');
      await writeFile(svgPath, svg);
      const reference = await png({...document, format: 'png'});
      const browser = await chromium.launch();
      const page = await browser.newPage();
      await page.setContent(
        `<!doctype html><body style="margin:0"><img src="data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}"></body>`,
      );
      await page
        .locator('img')
        .evaluate(img => (img as HTMLImageElement).decode());
      const chrome = PNG.sync.read(
        await page.locator('img').screenshot({omitBackground: true}),
      );
      await browser.close();
      await save('p3-svg.png', sheet([reference, chrome], 2));
      const percent = diffPercent(reference, chrome);
      let safari: string;
      try {
        await promisify(execFile)('qlmanage', [
          '-t',
          '-s',
          String(reference.width),
          '-o',
          out,
          svgPath,
        ]);
        safari = join(out, 'p3.svg.png');
      } catch (error) {
        safari = `not run: ${(error as Error).message.split('\n')[0]}`;
      }
      return {
        pass: !svg.includes('foreignObject') && percent <= MAX_DIFF_PERCENT,
        foreignObject: svg.includes('foreignObject'),
        chromeVersusPngPercent: percent,
        safariQuickLook: safari,
      };
    }),
  );

  results.push(
    await lane('6 opacity 50, radius 0', async () => {
      const image = await png(
        snapshot({frame: {opacity: 50, radius: 0}, terminal: {opacity: 50}}),
      );
      await save('p3-opacity.png', image);
      return {
        pass: pixel(image, 0, 0)[3] > 0 && pixel(image, 0, 0)[3] < 255,
        cornerAlpha: pixel(image, 0, 0)[3],
        note: 'the opacity cell of takumi-vs-chrome compares it with Chrome',
      };
    }),
  );

  results.push(
    await lane('7 fonts', async () => {
      const fontIds = await supportedFontIds();
      const images = [];
      for (const fontId of fontIds) {
        images.push(await png(snapshot({options: {fontId}})));
      }
      await save('p3-fonts.png', sheet(images, 4));
      const signatures = new Set(
        images.map(image => image.data.toString('base64')),
      );
      return {
        pass: signatures.size === fontIds.length,
        fonts: fontIds.length,
        distinctRenders: signatures.size,
      };
    }),
  );

  results.push(
    await lane('8 scale', async () => {
      const sizes = [];
      const images = [];
      for (const scale of [1, 2, 3]) {
        const image = await png(snapshot({}, {scale}));
        images.push(image);
        sizes.push([image.width, image.height]);
      }
      await save('p3-scale.png', sheet(images, 3));
      const [[w, h]] = sizes;
      return {
        pass: sizes.every(
          ([sw, sh], i) => sw === w * (i + 1) && sh === h * (i + 1),
        ),
        sizes,
      };
    }),
  );

  results.push(
    await lane('9 bad version', async () => {
      const message = await renderSnapshot(snapshot({}, {$version: 999})).then(
        () => 'rendered',
        (error: Error) => error.message,
      );
      await writeFile(join(out, 'p3-bad-version.txt'), `${message}\n`);
      return {pass: message.includes('999'), message};
    }),
  );

  results.push(
    await lane('10 huge', async () => {
      const code = Array.from(
        {length: 1000},
        (_, n) => `const line${n + 1} = ${n + 1};`,
      ).join('\n');
      const document = snapshot({
        editor: {code},
        options: {showLineNumbers: true},
      });
      const atDefaultScale = await renderSnapshot({...document, scale: 2}).then(
        bytes => `rendered ${(bytes as Uint8Array).byteLength} bytes`,
        (error: Error) => error.message,
      );
      const image = await png(document);
      await save('p3-huge.png', image);
      const tail = new PNG({width: image.width, height: 400});
      PNG.bitblt(image, tail, 0, image.height - 400, image.width, 400, 0, 0);
      await save('p3-huge-tail.png', tail);
      const gutterEnd = lastInkRow(image, 105, 138, 150);
      const codeEnd = lastInkRow(image, 160, 200, 150);
      return {
        pass: image.height > 1000 * 22 && Math.abs(gutterEnd - codeEnd) < 22,
        gutterEnd,
        codeEnd,
        scale1Size: [image.width, image.height],
        scale2: atDefaultScale,
      };
    }),
  );

  await writeFile(join(out, 'results.json'), JSON.stringify(results, null, 2));
  console.log(`Results in ${join(out, 'results.json')}`);
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
