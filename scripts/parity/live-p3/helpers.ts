import {parseArgs} from 'node:util';
import type {SnapshotInput} from '../../../packages/render/dist/index.mjs';
import {PNG} from 'pngjs';
import {renderSnapshot} from '../../../packages/render/dist/index.mjs';
import {writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import pixelmatch from 'pixelmatch';
import {PIXELMATCH_THRESHOLD} from '../lib';
export const {values: args} = parseArgs({
  options: {out: {type: 'string', default: '/tmp/codeimage-parity/live-p3'}},
});
export const out = args.out;
export const CODE = [
  'function Counter() {',
  '  const [count, setCount] = createSignal(0);',
  '  return <div>The count is {count()}</div>;',
  '}',
].join('\n');
export function snapshot(
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
export const png = async (input: SnapshotInput) =>
  PNG.sync.read(Buffer.from((await renderSnapshot(input)) as Uint8Array));
export function sheet(images: PNG[], columns: number): PNG {
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
export const save = (name: string, image: PNG) =>
  writeFile(join(out, name), PNG.sync.write(image));
export function diffPercent(a: PNG, b: PNG) {
  if (a.width !== b.width || a.height !== b.height) return 100;
  const pixels = pixelmatch(a.data, b.data, null, a.width, a.height, {
    threshold: PIXELMATCH_THRESHOLD,
  });
  return (pixels / (a.width * a.height)) * 100;
}
export function lastInkRow(
  image: PNG,
  from: number,
  to: number,
  reference: number,
) {
  for (let y = image.height - 1; y >= 0; y--) {
    const [r, g, b] = pixel(image, reference, y);
    for (let x = from; x < to; x++) {
      const [pr, pg, pb] = pixel(image, x, y);
      if (Math.abs(pr - r) + Math.abs(pg - g) + Math.abs(pb - b) > 60) return y;
    }
  }
  return -1;
}
export function pixel(image: PNG, x: number, y: number) {
  const i = (y * image.width + x) * 4;
  return [...image.data.subarray(i, i + 4)];
}
export async function lane<T>(name: string, run: () => Promise<T>) {
  try {
    const result = await run();
    console.log(name, JSON.stringify(result));
    return {lane: name, ...result};
  } catch (error) {
    console.log(name, 'ERROR', (error as Error).message);
    return {lane: name, pass: false, error: (error as Error).message};
  }
}
