// Usage: pnpm libs:build && pnpm exec tsx scripts/parity/animation-gif.ts [--case <name>]... [--runs 5] [--out <dir>]
// Preserved from PR #762. The web audit in .agents/skills/verify-codeimage/
// scripts/animation-gif.mjs runs on main without packages/render.
// Needs packages/render with renderAnimation (A2, #726). Renders each case's
// raw frames once with Takumi, encodes them as GIF with Takumi and with
// gifenc, decodes every GIF back as Chrome plays it, and compares the frame
// shown at each raw frame's time with that raw frame.
import {mkdir, readFile, writeFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {cpus, loadavg} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {parseArgs} from 'node:util';
const {applyPalette, GIFEncoder, nearestColorIndex, quantize} = createRequire(
  new URL('../../apps/codeimage/package.json', import.meta.url),
)('gifenc');
import {decodeGif} from '../../apps/codeimage/src/core/gif/decode.test-utils';
import pixelmatch from 'pixelmatch';
import {PNG} from 'pngjs';
import type {AnimationInput} from '../../packages/render/dist/index.mjs';
import {parseAnimationDocument} from '../../packages/render/dist/index.mjs';
import {clearGifFrames} from '../../packages/render/src/gif';
import {PIXELMATCH_THRESHOLD} from './lib';

const {values: args} = parseArgs({
  options: {
    out: {type: 'string', default: '/tmp/codeimage-parity/animation-gif'},
    case: {type: 'string', multiple: true},
    runs: {type: 'string', default: '5'},
    // Edge cases check quality, so one timed run is enough for them.
    'edge-runs': {type: 'string', default: '1'},
    'palette-sample': {type: 'string', default: '16'},
    // Renders with Takumi WASM, as the web app does, instead of the native
    // addon.
    wasm: {type: 'boolean', default: false},
    // Three edge cases hold over 2 GiB of raw frames at scale 2.
    scale: {type: 'string', default: '2'},
  },
});
const out = args.out;

// A channel step a viewer sees as a band on a gradient.
const BAND_LEVEL = 16;
// A channel step a viewer sees as another color, like an orange red light.
const WRONG_LEVEL = 48;
// A 4x4 Bayer matrix moves each color by at most half this many levels. The
// offset depends only on the pixel's place, so a still pixel keeps its entry.
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
const DITHER_SPREAD = 12;
// Raw frames a case may hold in memory before it is skipped.
const MAX_CLIP_BYTES = 2 ** 31;

const dist = new URL('../../packages/render/dist/', import.meta.url);

function createRenderer() {
  if (!args.wasm) {
    const {Renderer} = createRequire(
      new URL('../../packages/render/package.json', import.meta.url),
    )('@takumi-rs/core');
    return new Renderer();
  }
  const {Renderer} = createRequire(
    new URL('../../apps/codeimage/package.json', import.meta.url),
  )('@takumi-rs/wasm/node');
  return new Renderer();
}

interface Settings {
  steps: {editorId: string; holdMs: number}[];
  transitionMs: number;
  easing: 'smooth' | 'snappy' | 'linear';
  fps: 24 | 30 | 50 | 60;
}
type Document = ReturnType<typeof parseAnimationDocument>;
interface Layout {
  width: number;
  height: number;
  children: Layout[];
  runs: {text: string; width: number}[];
}
interface Entry {
  renderFrame(document: Document): Promise<{fontFamily: string}>;
  renderAnimationScenes(
    document: Document,
    settings: Omit<Settings, 'fps'> & {fps: number},
    measure: (html: string, css: string) => Promise<Layout>,
  ): Promise<{
    scenes: {html: string; durationMs: number}[];
    css: string;
    width: number;
    height: number;
    backgroundImage: string | null;
  }>;
}
interface FontFile {
  file: string;
  weight?: number;
  unicodeRange?: [number, number][];
}

// Raw RGBA frames sampled every `frameMs`, as a GIF plays them.
interface Clip {
  name: string;
  fps: number;
  width: number;
  height: number;
  frameMs: number;
  durationMs: number;
  frames: Buffer[];
  takumiGif(): Promise<Buffer>;
}

interface Timed<T> {
  value: T;
  wallMs: number;
  cpuMs: number;
}

async function timed<T>(work: () => Promise<T> | T): Promise<Timed<T>> {
  const cpu = process.cpuUsage();
  const start = performance.now();
  const value = await work();
  const wallMs = performance.now() - start;
  const {user, system} = process.cpuUsage(cpu);
  return {value, wallMs, cpuMs: (user + system) / 1000};
}

// Copied from packages/render/src/render.ts.
const gradientCorner = /(linear-gradient\(\s*)to (left|right) (top|bottom)\b/g;
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

async function loadRuntime() {
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
  const renderer = createRenderer();
  const register = async (family: string, files: FontFile[]) => {
    for (const {file, ...face} of files) {
      await renderer.registerFont({
        name: family,
        data: await readFile(fileURLToPath(new URL(`fonts/${file}`, dist))),
        ...face,
      });
    }
  };
  for (const {family, files} of manifest.fallbacks)
    await register(family, files);
  await register('Inter var', manifest.fonts.ui);
  const appFonts = new Map<string, Promise<void>>();
  const registerAppFont = (fontId: string, family: string) => {
    if (!appFonts.has(fontId))
      appFonts.set(fontId, register(family, manifest.fonts[fontId]));
    return appFonts.get(fontId)!;
  };
  return {
    entry,
    renderer,
    registerAppFont,
    pageCss: (css: string) => [css, stylesheet].map(normalizeGradients),
    fontFamilies: manifest.fallbacks.map(({family}) => family),
  };
}
type Runtime = Awaited<ReturnType<typeof loadRuntime>>;

// The rate packages/render plays a GIF at: whole hundredths of a second, at
// least two of them.
const gifFps = (fps: number) => 100 / Math.ceil(100 / Math.min(fps, 50));

async function prepareClip(
  runtime: Runtime,
  name: string,
  input: AnimationInput,
  settings: Settings,
): Promise<{clip?: Clip; render: () => Promise<Timed<Buffer[]>>}> {
  const {entry, renderer, registerAppFont, pageCss, fontFamilies} = runtime;
  const document = parseAnimationDocument({
    ...input,
    format: 'gif',
    animation: settings,
  });
  const {scale} = document;
  const {fontFamily} = await entry.renderFrame(document);
  await registerAppFont(document.editor.options.fontId, fontFamily);
  const fps = gifFps(settings.fps);
  const animation = await entry.renderAnimationScenes(
    document,
    {...document.animation, fps},
    async (html, css) => {
      const inCss = (node: Layout): Layout => ({
        width: node.width / scale,
        height: node.height / scale,
        children: node.children.map(inCss),
        runs: node.runs.map(run => ({
          text: run.text,
          width: run.width / scale,
        })),
      });
      return inCss(
        await renderer.measure(normalizeStyleAttributes(html), {
          css: pageCss(css),
          fontFamilies,
          devicePixelRatio: scale,
        }),
      );
    },
  );
  const width = Math.floor(animation.width * scale);
  const height = Math.floor(animation.height * scale);
  const scenes = animation.scenes.map(({html, durationMs}) => ({
    node: normalizeStyleAttributes(html),
    durationMs,
  }));
  if (animation.backgroundImage)
    throw new Error(`${name}: background images are not supported here`);
  const common = {
    css: pageCss(animation.css),
    fontFamilies,
    devicePixelRatio: scale,
    width,
    height,
  };
  const frameMs = 1000 / fps;
  const durationMs = scenes.reduce((sum, {durationMs}) => sum + durationMs, 0);
  const count = Math.ceil(durationMs / frameMs);
  const sceneAt = (ms: number) => {
    let start = 0;
    for (const scene of scenes) {
      if (ms < start + scene.durationMs) return {scene, timeMs: ms - start};
      start += scene.durationMs;
    }
    const last = scenes.at(-1)!;
    return {scene: last, timeMs: last.durationMs};
  };
  const render = () =>
    timed(async () => {
      const frames: Buffer[] = [];
      for (let index = 0; index < count; index++) {
        const {scene, timeMs} = sceneAt(index * frameMs);
        const raw: Uint8Array = await renderer.render(scene.node, {
          ...common,
          format: 'raw',
          timeMs,
        });
        // WASM returns a Uint8Array, and gifenc's applyPalette reads the
        // whole ArrayBuffer behind a view.
        const own = raw.byteOffset ? raw.slice() : raw;
        frames.push(Buffer.from(own.buffer, 0, own.byteLength));
      }
      return frames;
    });
  if (width * height * 4 * count > MAX_CLIP_BYTES) return {render};
  return {
    render,
    clip: {
      name,
      fps,
      width,
      height,
      frameMs,
      durationMs,
      frames: [],
      takumiGif: () =>
        renderer.renderAnimation({...common, scenes, fps, format: 'gif'}),
    },
  };
}

// One run of identical frames becomes one GIF frame with a longer delay.
function runsOf(frames: Buffer[]) {
  const runs: {frame: Buffer; count: number}[] = [];
  for (const frame of frames) {
    const last = runs.at(-1);
    if (last?.frame.equals(frame)) last.count++;
    else runs.push({frame, count: 1});
  }
  return runs;
}

const isClear = (frame: Uint8Array, pixel: number) =>
  frame[pixel * 4 + 3] < 128;

function opaquePixels(frames: Uint8Array[]) {
  const views = frames.map(
    frame => new Uint32Array(frame.buffer, frame.byteOffset, frame.length / 4),
  );
  let total = 0;
  for (const view of views) total += view.length;
  const packed = new Uint32Array(total);
  let length = 0;
  for (const [index, view] of views.entries()) {
    for (let pixel = 0; pixel < view.length; pixel++) {
      if (!isClear(frames[index], pixel)) packed[length++] = view[pixel];
    }
  }
  return new Uint8Array(packed.buffer, 0, length * 4);
}

// gifenc's applyPalette keeps a cache per call keyed by the RGB565 bin, so
// the first exact color it meets in a bin picks the entry for the whole bin,
// and a pixel that does not change can change entry from one frame to the
// next. This cache is keyed by the exact color and lives for the whole clip.
function stableIndexer(palette: number[][], width: number, dither: boolean) {
  const cache = new Int16Array(1 << 24).fill(-1);
  const offsets = BAYER.map(level =>
    Math.round(((level + 0.5) / 16 - 0.5) * DITHER_SPREAD),
  );
  const clamp = (value: number) => (value < 0 ? 0 : value > 255 ? 255 : value);
  return (frame: Uint8Array) => {
    const colors = new Uint32Array(
      frame.buffer,
      frame.byteOffset,
      frame.length / 4,
    );
    const indexed = new Uint8Array(colors.length);
    for (let pixel = 0; pixel < colors.length; pixel++) {
      let key = colors[pixel] & 0xffffff;
      if (dither) {
        const offset =
          offsets[
            ((Math.floor(pixel / width) & 3) << 2) | ((pixel % width) & 3)
          ];
        key =
          clamp((key & 0xff) + offset) |
          (clamp(((key >> 8) & 0xff) + offset) << 8) |
          (clamp((key >> 16) + offset) << 16);
      }
      let entry = cache[key];
      if (entry < 0) {
        entry = cache[key] = nearestColorIndex(palette, [
          key & 0xff,
          (key >> 8) & 0xff,
          key >> 16,
        ]);
      }
      indexed[pixel] = entry;
    }
    return indexed;
  };
}

// global: one palette from a sample of frames, mapped by gifenc. stable: the
// same palette, mapped by stableIndexer. dither: stable with ordered
// dithering. frame: a palette per frame.
type GifencMode = 'global' | 'stable' | 'dither' | 'frame';

// gifenc gives no transparent palette entry of its own, so it quantizes the
// opaque pixels to 255 colors and every pixel under half alpha takes entry 255.
// A frame with clear pixels is cleared after it shows, so the next whole frame
// never draws over it.
function encodeGifenc(clip: Clip, mode: GifencMode): Uint8Array {
  const {width, height, frames, frameMs} = clip;
  const pixels = width * height;
  const hasClear = frames.some(frame => {
    for (let pixel = 0; pixel < pixels; pixel++)
      if (isClear(frame, pixel)) return true;
    return false;
  });
  const colors = hasClear ? 255 : 256;
  const paletteOf = (sample: Uint8Array[]) =>
    quantize(opaquePixels(sample), colors) as number[][];
  const sampleSize = Number(args['palette-sample']);
  const sample = Array.from(
    {length: Math.min(sampleSize, frames.length)},
    (_, index) =>
      frames[
        Math.round((index * (frames.length - 1)) / Math.max(1, sampleSize - 1))
      ],
  );
  const shared = mode === 'frame' ? undefined : paletteOf(sample);
  const stable =
    mode === 'stable' || mode === 'dither'
      ? stableIndexer(shared!, width, mode === 'dither')
      : undefined;
  const gif = GIFEncoder();
  for (const [index, {frame, count}] of runsOf(frames).entries()) {
    const palette = shared ?? paletteOf([frame]);
    const indexed = stable
      ? stable(frame)
      : (applyPalette(frame, palette) as Uint8Array);
    if (hasClear) {
      for (let pixel = 0; pixel < pixels; pixel++)
        if (isClear(frame, pixel)) indexed[pixel] = palette.length;
    }
    const table = hasClear ? [...palette, [0, 0, 0]] : palette;
    gif.writeFrame(indexed, width, height, {
      palette: index === 0 || !shared ? table : undefined,
      delay: count * frameMs,
      transparent: hasClear,
      transparentIndex: palette.length,
      dispose: hasClear ? 2 : 1,
    });
  }
  gif.finish();
  return gif.bytes();
}

interface Quality {
  gifFrames: number;
  gifMs: number;
  localPalettes: number;
  disposals: string;
  diffMean: number;
  diffMax: number;
  errorMean: number;
  bandMean: number;
  bandMax: number;
  wrong: number;
  maxDelta: number;
  holes: number;
  ghosts: number;
  flicker: number;
}

// Compares the frame Chrome shows at each raw frame's time with that frame.
// A hole is a pixel the render draws opaque that the GIF leaves clear, a
// ghost is the reverse, and flicker is a pixel that changes in the GIF while
// the render keeps it. Edge pixels with partial alpha count for neither.
function measure(clip: Clip, bytes: Uint8Array, keep: Set<number>) {
  const {width, height, frames, frameMs} = clip;
  const pixels = width * height;
  const kept = new Map<number, Uint8Array>();
  const disposals = new Set<number>();
  let localPalettes = 0;
  let gifFrames = 0;
  let gifMs = 0;
  const decoded = decodeGif(bytes);
  let current = decoded.next();
  let upcoming = decoded.next();
  let diffSum = 0;
  let diffMax = 0;
  let errorSum = 0;
  let bandSum = 0;
  let bandMax = 0;
  let wrong = 0;
  let maxDelta = 0;
  let holes = 0;
  let ghosts = 0;
  let flickered = 0;
  let still = 0;
  let previous: {raw: Uint8Array; shown: Uint8Array} | undefined;
  const count = (frame: IteratorResult<ShownFrame>) => {
    if (frame.done) return;
    gifFrames++;
    gifMs += frame.value.delayMs;
    disposals.add(frame.value.disposal);
    if (frame.value.localPalette) localPalettes++;
  };
  count(current);
  count(upcoming);
  for (const [index, raw] of frames.entries()) {
    const timeMs = Math.round(index * frameMs);
    while (!upcoming.done && upcoming.value.startMs <= timeMs) {
      current = upcoming;
      upcoming = decoded.next();
      count(upcoming);
    }
    if (current.done) throw new Error(`${clip.name}: GIF has no frames`);
    const shown = current.value.rgba;
    if (keep.has(index)) kept.set(index, shown);
    const diff =
      (pixelmatch(raw, shown, null, width, height, {
        threshold: PIXELMATCH_THRESHOLD,
      }) /
        pixels) *
      100;
    diffSum += diff;
    diffMax = Math.max(diffMax, diff);
    let error = 0;
    let opaque = 0;
    let banded = 0;
    for (let pixel = 0; pixel < pixels; pixel++) {
      const at = pixel * 4;
      const [drawn, alpha] = [raw[at + 3], shown[at + 3]];
      if (drawn === 255 && alpha === 0) holes++;
      if (drawn === 0 && alpha === 255) ghosts++;
      if (drawn === 255 && alpha === 255) {
        opaque++;
        let worst = 0;
        for (let channel = 0; channel < 3; channel++) {
          const delta = Math.abs(raw[at + channel] - shown[at + channel]);
          error += delta;
          worst = Math.max(worst, delta);
        }
        if (worst > BAND_LEVEL) banded++;
        if (worst > WRONG_LEVEL) wrong++;
        if (worst > maxDelta) maxDelta = worst;
      }
      if (previous) {
        const same =
          raw[at] === previous.raw[at] &&
          raw[at + 1] === previous.raw[at + 1] &&
          raw[at + 2] === previous.raw[at + 2] &&
          raw[at + 3] === previous.raw[at + 3];
        if (same) {
          still++;
          if (
            shown[at] !== previous.shown[at] ||
            shown[at + 1] !== previous.shown[at + 1] ||
            shown[at + 2] !== previous.shown[at + 2] ||
            shown[at + 3] !== previous.shown[at + 3]
          )
            flickered++;
        }
      }
    }
    errorSum += opaque ? error / (opaque * 3) : 0;
    const band = opaque ? (banded / opaque) * 100 : 0;
    bandSum += band;
    bandMax = Math.max(bandMax, band);
    previous = {raw, shown};
  }
  while (!upcoming.done) {
    upcoming = decoded.next();
    count(upcoming);
  }
  const quality: Quality = {
    gifFrames,
    gifMs,
    localPalettes,
    disposals: [...disposals].sort().join('/'),
    diffMean: diffSum / frames.length,
    diffMax,
    errorMean: errorSum / frames.length,
    bandMean: bandSum / frames.length,
    bandMax,
    wrong,
    maxDelta,
    holes,
    ghosts,
    flicker: still ? (flickered / still) * 100 : 0,
  };
  return {quality, kept};
}

const median = (values: number[]) => {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = sorted.length >> 1;
  return sorted.length % 2
    ? sorted[middle]
    : (sorted[middle - 1] + sorted[middle]) / 2;
};

function shrink(
  rgba: Uint8Array,
  width: number,
  height: number,
  factor: number,
) {
  const png = new PNG({
    width: Math.floor(width / factor),
    height: Math.floor(height / factor),
  });
  for (let y = 0; y < png.height; y++) {
    for (let x = 0; x < png.width; x++) {
      const sum = [0, 0, 0, 0];
      for (let dy = 0; dy < factor; dy++)
        for (let dx = 0; dx < factor; dx++) {
          const at = ((y * factor + dy) * width + x * factor + dx) * 4;
          const alpha = rgba[at + 3] / 255;
          // Over white, so clear pixels read as a page and not as black.
          for (let channel = 0; channel < 3; channel++)
            sum[channel] += rgba[at + channel] * alpha + 255 * (1 - alpha);
        }
      const target = (y * png.width + x) * 4;
      for (let channel = 0; channel < 3; channel++)
        png.data[target + channel] = Math.round(sum[channel] / factor ** 2);
      png.data[target + 3] = 255;
    }
  }
  return png;
}

function crop(
  rgba: Uint8Array,
  width: number,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  const png = new PNG({width: w, height: h});
  for (let row = 0; row < h; row++) {
    for (let col = 0; col < w; col++) {
      const source = ((y + row) * width + x + col) * 4;
      const target = (row * w + col) * 4;
      const alpha = rgba[source + 3] / 255;
      for (let channel = 0; channel < 3; channel++)
        png.data[target + channel] = Math.round(
          rgba[source + channel] * alpha + 255 * (1 - alpha),
        );
      png.data[target + 3] = 255;
    }
  }
  return png;
}

// One row per encoder, raw first, one column per sampled time.
function sheet(rows: PNG[][]) {
  const gap = 4;
  const [cellWidth, cellHeight] = [rows[0][0].width, rows[0][0].height];
  const png = new PNG({
    width: rows[0].length * (cellWidth + gap) - gap,
    height: rows.length * (cellHeight + gap) - gap,
  });
  png.data.fill(255);
  for (const [row, cells] of rows.entries())
    for (const [col, cell] of cells.entries())
      PNG.bitblt(
        cell,
        png,
        0,
        0,
        cell.width,
        cell.height,
        col * (cellWidth + gap),
        row * (cellHeight + gap),
      );
  return png;
}

const GIFENC_MODES: GifencMode[] = ['global', 'stable', 'dither', 'frame'];
type EncoderName = 'takumi' | 'takumi-clear' | `gifenc-${GifencMode}`;
const ENCODERS: EncoderName[] = [
  'takumi',
  'takumi-clear',
  ...GIFENC_MODES.map(mode => `gifenc-${mode}` as const),
];

async function runCase(
  runtime: Runtime,
  {
    name,
    input,
    settings,
    runs,
  }: {name: string; input: AnimationInput; settings: Settings; runs: number},
) {
  const {clip, render} = await prepareClip(runtime, name, input, settings);
  if (!clip) {
    console.log(JSON.stringify({case: name, skipped: 'raw frames over 2 GiB'}));
    return [];
  }
  const times = Object.fromEntries(
    ['raw', ...ENCODERS].map(key => [key, [] as Timed<unknown>[]]),
  ) as Record<EncoderName | 'raw', Timed<unknown>[]>;
  const bytes = {} as Record<EncoderName, Uint8Array>;
  const encode: Record<string, () => Promise<void>> = {
    takumi: async () => {
      const run = await timed(() => clip.takumiGif());
      times.takumi.push(run);
      bytes.takumi = new Uint8Array(run.value);
      const patched = await timed(() => {
        const copy = bytes.takumi.slice();
        clearGifFrames(copy);
        return copy;
      });
      times['takumi-clear'].push({
        ...patched,
        wallMs: run.wallMs + patched.wallMs,
        cpuMs: run.cpuMs + patched.cpuMs,
      });
      bytes['takumi-clear'] = patched.value;
    },
    ...Object.fromEntries(
      GIFENC_MODES.map(mode => [
        `gifenc-${mode}`,
        async () => {
          const run = await timed(() => encodeGifenc(clip, mode));
          times[`gifenc-${mode}`].push(run);
          bytes[`gifenc-${mode}`] = run.value;
        },
      ]),
    ),
  };
  const order = Object.keys(encode);
  for (let run = 0; run < runs; run++) {
    const raw = await render();
    times.raw.push(raw);
    clip.frames = raw.value;
    for (const step of order.map(
      (_, index) => order[(index + run) % order.length],
    ))
      await encode[step]();
  }
  const caseDir = join(out, name);
  await mkdir(caseDir, {recursive: true});
  const columns = [0, 0.25, 0.5, 0.75, 1].map(at =>
    Math.round(at * (clip.frames.length - 1)),
  );
  const keep = new Set(columns);
  const factor = Math.max(1, Math.ceil(clip.width / 320));
  const cropBox = {
    w: Math.min(360, clip.width),
    h: Math.min(220, clip.height),
  };
  const cropAt = {
    x: Math.floor((clip.width - cropBox.w) * 0.15),
    y: Math.floor((clip.height - cropBox.h) * 0.2),
  };
  const overview: PNG[][] = [
    columns.map(index =>
      shrink(clip.frames[index], clip.width, clip.height, factor),
    ),
  ];
  const zoom: PNG[][] = [
    columns.map(index =>
      crop(
        clip.frames[index],
        clip.width,
        cropAt.x,
        cropAt.y,
        cropBox.w,
        cropBox.h,
      ),
    ),
  ];
  const rows = [];
  const rawMs = median(times.raw.map(({wallMs}) => wallMs));
  const spread = (list: Timed<unknown>[]) => {
    const walls = list.map(({wallMs}) => wallMs);
    return {
      median: median(walls),
      min: Math.min(...walls),
      max: Math.max(...walls),
      cpu: median(list.map(({cpuMs}) => cpuMs)),
      cpuRatio: median(list.map(({cpuMs, wallMs}) => cpuMs / wallMs)),
    };
  };
  for (const encoder of ENCODERS) {
    await writeFile(
      join(caseDir, `${clip.fps}fps-${encoder}.gif`),
      bytes[encoder],
    );
    const {quality, kept} = measure(clip, bytes[encoder], keep);
    overview.push(
      columns.map(index =>
        shrink(kept.get(index)!, clip.width, clip.height, factor),
      ),
    );
    zoom.push(
      columns.map(index =>
        crop(
          kept.get(index)!,
          clip.width,
          cropAt.x,
          cropAt.y,
          cropBox.w,
          cropBox.h,
        ),
      ),
    );
    const time = spread(times[encoder]);
    // gifenc starts from raw frames that the export renders first.
    const pipelineMs = encoder.startsWith('gifenc')
      ? time.median + rawMs
      : time.median;
    const row = {
      case: name,
      fps: clip.fps,
      size: `${clip.width}x${clip.height}`,
      frames: clip.frames.length,
      encoder,
      gifFrames: quality.gifFrames,
      gifMs: quality.gifMs,
      clipMs: clip.durationMs,
      localPalettes: quality.localPalettes,
      disposal: quality.disposals,
      diffMean: +quality.diffMean.toFixed(3),
      diffMax: +quality.diffMax.toFixed(3),
      errorMean: +quality.errorMean.toFixed(2),
      bandMean: +quality.bandMean.toFixed(3),
      bandMax: +quality.bandMax.toFixed(3),
      wrong: quality.wrong,
      maxDelta: quality.maxDelta,
      holes: quality.holes,
      ghosts: quality.ghosts,
      flicker: +quality.flicker.toFixed(3),
      kb: Math.round(bytes[encoder].length / 1024),
      encodeMs: Math.round(time.median),
      encodeRange: `${Math.round(time.min)}-${Math.round(time.max)}`,
      cpuMs: Math.round(time.cpu),
      cpuRatio: +time.cpuRatio.toFixed(2),
      rawRenderMs: Math.round(rawMs),
      pipelineMs: Math.round(pipelineMs),
      runs: times[encoder].length,
    };
    rows.push(row);
    console.log(JSON.stringify(row));
  }
  await writeFile(
    join(caseDir, `${clip.fps}fps-sheet.png`),
    PNG.sync.write(sheet(overview)),
  );
  await writeFile(
    join(caseDir, `${clip.fps}fps-zoom.png`),
    PNG.sync.write(sheet(zoom)),
  );
  return rows;
}

const BASE: AnimationInput = {
  $version: '1.10.0',
  $snippetId: null,
  format: 'gif',
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
} as AnimationInput;

type Tab = {
  code: string;
  marks?: unknown;
  lineNumberStart?: number;
  tabName?: string;
};
type Overrides = {
  options?: Record<string, unknown>;
  terminal?: Record<string, unknown>;
  frame?: Record<string, unknown>;
  width?: number;
  languageId?: string;
};

function project(tabs: Tab[], overrides: Overrides = {}): AnimationInput {
  return {
    ...BASE,
    ...(overrides.width ? {width: overrides.width} : {}),
    frame: {...BASE.frame, ...overrides.frame},
    terminal: {...BASE.terminal, ...overrides.terminal},
    editor: {
      options: {...BASE.editor.options, ...overrides.options},
      editors: tabs.map(({code, marks, lineNumberStart, tabName}, index) => ({
        id: String.fromCharCode(97 + index),
        code,
        tabName: tabName ?? `step-${index + 1}.ts`,
        languageId: overrides.languageId ?? 'typescript',
        lineNumberStart: lineNumberStart ?? 1,
        ...(marks ? {marks} : {}),
      })),
    },
  } as AnimationInput;
}

// The A1 edge cases from scripts/parity/animation-endpoints.ts on #707.
function edgeCases(): {name: string; input: AnimationInput}[] {
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
  const CROSS_FROM = `const total = items.length * 2;
const label = 'short';`;
  const CROSS_TO = `const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0) * taxRate;
const label = 'a much longer label that pushes the code past the width of the tab header';`;
  const LONG_LINES = `${CROSS_TO} ${CROSS_TO.replace('\n', ' ')}`;
  const numbered = (rows: number, value: (index: number) => string) =>
    Array.from(
      {length: rows},
      (_, index) => `const line${index} = ${value(index)};`,
    ).join('\n');
  const grid = (rows: number) =>
    `const grid = [\n${Array.from({length: rows}, (_, row) => `  [${Array.from({length: 80}, (_, index) => (row * 7 + index) % 10).join(', ')}],`).join('\n')}\n];`;
  const GROW = `${SHORT}\n${Array.from({length: 20}, (_, index) => `const line${index} = greeting.length * ${index};`).join('\n')}`;
  const pair = (from: Tab, to: Tab, overrides?: Overrides) =>
    project([from, to], overrides);
  const gutter = {options: {showLineNumbers: true}};
  return [
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
        gutter,
      ),
    },
    {
      name: 'edge-tabs',
      input: pair(
        {code: 'function f() {\n\treturn 1;\n}'},
        {code: 'function f() {\n\tconst a\t= 2;\n\t\treturn a;\t// done\n}'},
      ),
    },
    {name: 'edge-empty-from', input: pair({code: ''}, {code: SHORT}, gutter)},
    {name: 'edge-empty-to', input: pair({code: SHORT}, {code: ''}, gutter)},
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
    {name: 'edge-periodic', input: pair({code: grid(8)}, {code: grid(20)})},
    {
      name: 'edge-header-cross',
      input: pair(
        {code: CROSS_FROM, tabName: 'animation-before-the-change.ts'},
        {code: CROSS_TO, tabName: 'animation-after.ts'},
      ),
    },
    {
      name: 'edge-glyph-tab',
      input: pair(
        {code: `const a = '世';`, tabName: '世'},
        {code: `const a = '世界';\nconst b = '界';`, tabName: '界'},
      ),
    },
    {
      name: 'edge-target',
      input: pair(
        {code: SHORT},
        {code: GROW},
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
        gutter,
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
        gutter,
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
        gutter,
      ),
    },
    {
      name: 'edge-line-start',
      input: pair(
        {code: EIGHT, lineNumberStart: 1},
        {code: EIGHT, lineNumberStart: 98},
        gutter,
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
}

const CLIP_STEPS = [
  `type Item = {name: string; price: number};

export function total(items: Item[]) {
  let sum = 0;
  for (const item of items) {
    sum += item.price;
  }
  return sum;
}`,
  `type Item = {name: string; price: number; quantity: number};

export function total(items: Item[], taxRate = 0.2) {
  let sum = 0;
  for (const item of items) {
    sum += item.price * item.quantity;
  }
  return sum * (1 + taxRate);
}`,
  `type Item = {name: string; price: number; quantity: number};

const subtotal = (item: Item) => item.price * item.quantity;

export function total(items: Item[], taxRate = 0.2): number {
  const sum = items.reduce((acc, item) => acc + subtotal(item), 0);
  return Math.round(sum * (1 + taxRate) * 100) / 100;
}

console.log(total([{name: 'Keyboard', price: 89, quantity: 2}]));`,
];

// Three steps, 600 ms holds and 600 ms morphs: 3 s.
const clipCase = (fps: 25 | 50) => ({
  name: `clip-3s-${fps}fps`,
  input: project(
    CLIP_STEPS.map((code, index) => ({
      code,
      tabName: ['cart.ts', 'cart.ts', 'cart.ts'][index],
    })),
    {
      options: {themeId: 'synthwave84', showLineNumbers: true},
      terminal: {background: '', textColor: ''},
      frame: {
        background:
          'linear-gradient(to right top, #8155c6, #9e56cb, #ba55ce, #d654cf, #f053ce)',
      },
    },
  ),
  settings: {
    steps: ['a', 'b', 'c'].map(editorId => ({editorId, holdMs: 600})),
    transitionMs: 600,
    easing: 'smooth',
    // GIF plays 30 fps settings at 25, as packages/render rounds it.
    fps: fps === 25 ? 30 : 50,
  } as Settings,
});

async function main() {
  const runtime = await loadRuntime();
  const edgeSettings: Settings = {
    steps: [
      {editorId: 'a', holdMs: 500},
      {editorId: 'b', holdMs: 500},
    ],
    transitionMs: 900,
    easing: 'smooth',
    fps: 50,
  };
  const all = [
    ...[clipCase(50), clipCase(25)].map(entry => ({
      ...entry,
      runs: Number(args.runs),
    })),
    ...edgeCases().map(entry => ({
      ...entry,
      settings: edgeSettings,
      runs: Number(args['edge-runs']),
    })),
  ];
  const selected = args.case?.length
    ? all.filter(({name}) => args.case!.includes(name))
    : all;
  await mkdir(out, {recursive: true});
  const [load1] = loadavg();
  console.log(
    `${args.wasm ? 'Takumi WASM' : 'Takumi native'}, load ${load1.toFixed(1)} on ${cpus().length} cores, ${cpus()[0].model}, node ${process.version}`,
  );
  const rows = [];
  for (const entry of selected) rows.push(...(await runCase(runtime, entry)));
  const [loadEnd] = loadavg();
  await writeFile(
    join(out, 'results.json'),
    JSON.stringify(
      {load: [load1, loadEnd], cores: cpus().length, rows},
      null,
      2,
    ),
  );
  console.log(`load at end ${loadEnd.toFixed(1)}`);
  console.table(
    rows.map(
      ({
        case: name,
        fps,
        encoder,
        diffMean,
        diffMax,
        errorMean,
        bandMax,
        wrong,
        maxDelta,
        holes,
        ghosts,
        flicker,
        kb,
        encodeMs,
        cpuMs,
        pipelineMs,
      }) => ({
        name,
        fps,
        encoder,
        diffMean,
        diffMax,
        errorMean,
        bandMax,
        wrong,
        maxDelta,
        holes,
        ghosts,
        flicker,
        kb,
        encodeMs,
        cpuMs,
        pipelineMs,
      }),
    ),
  );
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
