import {readFile} from 'node:fs/promises';
import type {MeasuredNode} from '@takumi-rs/core';
import {Renderer} from '@takumi-rs/core';
import type {PNG} from 'pngjs';
import {describe, expect, it} from 'vitest';
import type {AnimationInput} from './document';
import {parseSnapshotDocument, type SnapshotDocument} from './document';
import {
  animationFps,
  renderAnimation,
  renderSnapshot,
  snapshotMarkup,
} from './render';
import {sampleDocument} from './sample';
import {
  decode,
  decodeGif,
  plainDocument,
  readApngAnimation,
  readWebpAnimation,
} from './test-utils';

// The built SSR entry, called the way renderAnimation calls it.
interface AnimationEntry {
  renderAnimationScenes(
    document: SnapshotDocument,
    settings: {
      steps: {editorId: string; holdMs: number}[];
      transitionMs: number;
      easing: 'linear';
      fps: 30;
    },
    measure: (html: string, css: string) => Promise<MeasuredNode>,
  ): Promise<{
    scenes: {html: string; durationMs: number}[];
    css: string;
    width: number;
    height: number;
  }>;
}

const dist = new URL('../dist/', import.meta.url);

const twoTabs: SnapshotDocument = {
  ...sampleDocument,
  editor: {
    ...sampleDocument.editor,
    editors: [
      {...sampleDocument.editor.editors[0], id: 'a', code: 'const a = 1;'},
      {
        ...sampleDocument.editor.editors[0],
        id: 'b',
        tabName: 'two.ts',
        code: 'const a = 1;\nconst b = [a, a, a, a, a, a, a, a, a, a, a];',
      },
    ],
  },
};

async function setup() {
  const [entry, stylesheet, markup] = await Promise.all([
    import(
      new URL('ssr/entry-server.js', dist).href
    ) as Promise<AnimationEntry>,
    readFile(new URL('ssr/assets/style.css', dist), 'utf8'),
    snapshotMarkup(twoTabs),
  ]);
  const renderer = new Renderer();
  for (const font of markup.fonts) {
    await renderer.registerFont({
      name: font.family,
      data: await readFile(font.path),
      weight: font.weight,
      unicodeRange: font.unicodeRange,
    });
  }
  const measure = (
    html: string,
    css: string,
    options: {timeMs?: number; width?: number; height?: number} = {},
  ): Promise<MeasuredNode> =>
    renderer.measure(html, {css: [stylesheet, css], ...options});
  return {entry, measure};
}

const steps = (...editorIds: string[]) =>
  editorIds.map(editorId => ({editorId, holdMs: 500}));

describe('renderAnimationScenes', {timeout: 30_000}, () => {
  it('gives each scene its own frame and switches the active tab halfway', async () => {
    const {entry, measure} = await setup();
    const animation = await entry.renderAnimationScenes(
      parseSnapshotDocument(twoTabs),
      {steps: steps('a', 'b'), transitionMs: 900, easing: 'linear', fps: 30},
      measure,
    );
    expect(animation.scenes.map(scene => scene.durationMs)).toEqual([
      500, 450, 450, 500,
    ]);
    expect(
      animation.scenes.map(({html}) =>
        Array.from(html.matchAll(/data-active="(\w+)"/g), match => match[1]),
      ),
    ).toEqual([
      ['true', 'false'],
      ['true', 'false'],
      ['false', 'true'],
      ['false', 'true'],
    ]);

    // html > body > scene > preview wrapper > frame
    const frameAt = async (scene: number, timeMs: number) => {
      const {html, durationMs} = animation.scenes[scene];
      const root = await measure(html, animation.css, {
        timeMs: Math.min(timeMs, durationMs),
        width: animation.width,
        height: animation.height,
      });
      const frame = root.children[0].children[0].children[0].children[0];
      return {
        x: frame.transform[4],
        y: frame.transform[5],
        width: frame.width,
        height: frame.height,
      };
    };
    const [first, last] = [await frameAt(0, 0), await frameAt(3, 0)];
    expect(first.height).toBeLessThan(last.height);
    expect(await frameAt(1, 0)).toEqual(first);
    expect(await frameAt(2, 450)).toEqual(last);
  });

  it('names a step whose tab is gone', async () => {
    const {entry, measure} = await setup();
    await expect(
      entry.renderAnimationScenes(
        parseSnapshotDocument(twoTabs),
        {
          steps: steps('a', 'gone'),
          transitionMs: 900,
          easing: 'linear',
          fps: 30,
        },
        measure,
      ),
    ).rejects.toThrow('The snapshot has no tab "gone"');
  });
});

// Two tabs on a flat gray frame, so only code puts other colors in a frame.
// The second tab is four lines taller than the first.
const SHORT = 'short';
const TALL = 'tall\ntall\ntall\ntall\ntall';
const steps2 = (
  codes: [string, string],
  animation?: AnimationInput['animation'],
): AnimationInput => {
  const {format, ...base} = plainDocument(codes[0], {showLineNumbers: false});
  const [tab] = base.editor.editors;
  return {
    ...base,
    scale: 1,
    editor: {
      ...base.editor,
      editors: [
        {...tab, id: 'first', code: codes[0]},
        {...tab, id: 'second', tabName: 'second.ts', code: codes[1]},
      ],
    },
    animation,
  };
};

const sum = (values: number[]) =>
  values.reduce((total, value) => total + value, 0);

const still = async (input: AnimationInput, editor: number) => {
  const {animation, format, ...project} = input;
  return decode(
    await renderSnapshot({
      ...project,
      editor: {
        ...project.editor,
        editors: [project.editor.editors[editor]],
      },
    }),
  );
};

// A GIF pixel is drawn or clear. A ghost is drawn where the still, centered
// in the frame, is clear. A hole is the reverse.
const coverage = (frame: PNG, image: PNG) => {
  const left = Math.floor((frame.width - image.width) / 2);
  const top = Math.floor((frame.height - image.height) / 2);
  let [ghosts, holes] = [0, 0];
  for (let y = 0; y < frame.height; y++) {
    for (let x = 0; x < frame.width; x++) {
      const [column, row] = [x - left, y - top];
      const opaque =
        column >= 0 &&
        row >= 0 &&
        column < image.width &&
        row < image.height &&
        image.data[(row * image.width + column) * 4 + 3] > 0;
      const drawn = frame.data[(y * frame.width + x) * 4 + 3] > 0;
      if (drawn && !opaque) ghosts++;
      if (opaque && !drawn) holes++;
    }
  }
  return {ghosts, holes};
};

// The pixels that draw code. The margin around a smaller frame is clear.
const codePixels = (image: PNG) => {
  let count = 0;
  for (let i = 0; i < image.data.length; i += 4) {
    const [r, g, b, alpha] = image.data.subarray(i, i + 4);
    if (alpha && (r !== 128 || g !== 128 || b !== 128)) count++;
  }
  return count;
};

describe('renderAnimation', {timeout: 60_000}, () => {
  it('holds every tab and morphs between them when the project stores no animation', async () => {
    const input = steps2([SHORT, TALL]);
    const webp = readWebpAnimation(await renderAnimation(input));
    const [short, tall] = [await still(input, 0), await still(input, 1)];
    // The short tab has the longer line.
    expect(short.width).toBeGreaterThan(tall.width);
    expect(tall.height).toBeGreaterThan(short.height);
    expect([webp.width, webp.height]).toEqual([short.width, tall.height]);
    expect(sum(webp.durationsMs)).toBe(800 + 900 + 800);
    // WebP stores equal neighbors as one frame, so each hold is one frame
    // that may take in the still ends of the transition. The transition is
    // 27 frames at 30 fps.
    expect(webp.durationsMs.at(0)).toBeGreaterThanOrEqual(800);
    expect(webp.durationsMs.at(-1)).toBeGreaterThanOrEqual(800);
    expect(webp.durationsMs.length).toBeGreaterThan(20);
    expect(webp.durationsMs.length).toBeLessThanOrEqual(29);
  });

  it('plays the steps and the timing the project stores', async () => {
    const animation = (
      first: string,
      second: string,
    ): AnimationInput['animation'] => ({
      steps: [
        {editorId: first, holdMs: 100},
        {editorId: second, holdMs: 300},
      ],
      transitionMs: 200,
      easing: 'linear',
      fps: 60,
    });
    const render = async (first: string, second: string) => {
      const bytes = await renderAnimation({
        ...steps2([SHORT, TALL], animation(first, second)),
        format: 'apng',
      });
      // pngjs reads the first frame of an animated PNG.
      return {file: readApngAnimation(bytes), firstFrame: decode(bytes)};
    };
    const shortFirst = await render('first', 'second');
    const tallFirst = await render('second', 'first');
    expect(codePixels(shortFirst.firstFrame)).toBeGreaterThan(0);
    expect(codePixels(tallFirst.firstFrame)).toBeGreaterThan(
      2 * codePixels(shortFirst.firstFrame),
    );
    expect(Math.round(sum(shortFirst.file.durationsMs))).toBe(600);
    expect(shortFirst.file.durationsMs).toHaveLength(36);
  });

  it('scales the frames with the pixel ratio', async () => {
    const input = steps2([SHORT, TALL]);
    const [one, two] = await Promise.all(
      [1, 2].map(async scale =>
        readWebpAnimation(await renderAnimation({...input, scale})),
      ),
    );
    expect([two.width, two.height]).toEqual([2 * one.width, 2 * one.height]);
  });

  it.each([
    ['taller', [TALL, SHORT]],
    ['wider', [SHORT, TALL]],
  ] as const)(
    'draws a GIF hold after a %s step exactly where its still is',
    async (_, codes) => {
      const input = steps2([...codes]);
      const gif = decodeGif(await renderAnimation({...input, format: 'gif'}));
      expect(coverage(gif.frames[0], await still(input, 0))).toEqual({
        ghosts: 0,
        holes: 0,
      });
      expect(coverage(gif.frames.at(-1)!, await still(input, 1))).toEqual({
        ghosts: 0,
        holes: 0,
      });
    },
  );

  it.each([
    [60, 20],
    [50, 20],
    [30, 40],
    [24, 50],
  ] as const)(
    'plays a GIF asked for %i fps in frames of %i ms, at its real length',
    async (fps, frameMs) => {
      const gif = decodeGif(
        await renderAnimation({
          ...steps2([SHORT, SHORT], {
            steps: [
              {editorId: 'first', holdMs: 200},
              {editorId: 'second', holdMs: 200},
            ],
            transitionMs: 200,
            easing: 'linear',
            fps,
          }),
          format: 'gif',
        }),
      );
      expect(new Set(gif.durationsMs)).toEqual(new Set([frameMs]));
      expect(sum(gif.durationsMs)).toBe(600);
    },
  );

  it('names a step whose tab is gone', async () => {
    await expect(
      renderAnimation(
        steps2([SHORT, TALL], {
          steps: [{editorId: 'gone', holdMs: 100}],
          transitionMs: 100,
          easing: 'linear',
          fps: 30,
        }),
      ),
    ).rejects.toThrow('The snapshot has no tab "gone"');
  });
});

describe('Takumi', () => {
  // clearGifFrames makes up for this. When this fails, Takumi clears its GIF
  // frames itself: delete clearGifFrames.
  it('still marks no GIF frame to be cleared before the next one', async () => {
    const gif = await new Renderer().renderAnimation({
      scenes: [
        {
          node: '<div style="width:8px;height:8px;background:red"></div>',
          durationMs: 40,
        },
      ],
      width: 16,
      height: 16,
      fps: 50,
      format: 'gif',
    });
    const control = gif.indexOf(Buffer.from([0x21, 0xf9, 0x04]));
    expect(control).toBeGreaterThan(0);
    const DO_NOT_DISPOSE = 1;
    expect((gif[control + 3] >> 2) & 7).toBe(DO_NOT_DISPOSE);
  });
});

describe('animationFps', () => {
  it('keeps the frame rate of WebP and APNG', () => {
    expect([24, 30, 50, 60].map(fps => animationFps('webp', fps))).toEqual([
      24, 30, 50, 60,
    ]);
    expect(animationFps('apng', 60)).toBe(60);
  });
  it('gives GIF the nearest lower rate with frames of whole hundredths of a second', () => {
    expect([24, 30, 50, 60].map(fps => animationFps('gif', fps))).toEqual([
      20, 25, 50, 50,
    ]);
  });
});
