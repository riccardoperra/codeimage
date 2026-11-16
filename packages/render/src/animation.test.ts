import {readFile} from 'node:fs/promises';
import type {MeasuredNode} from '@takumi-rs/core';
import {Renderer} from '@takumi-rs/core';
import type {PNG} from 'pngjs';
import {describe, expect, it} from 'vitest';
import type {
  AnimationHost,
  AnimationScenes,
  AnimationTiming,
  ComposedFrame,
  FrameHost,
  FrameMarkup,
} from '../../../apps/codeimage/src/render/contract';
import {watermarkScenes} from './animationWatermark';
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
  decodeApng,
  decodeGif,
  plainDocument,
  readApngAnimation,
  readWebpAnimation,
} from './test-utils';
import {positionWatermark} from './watermarkGeometry';

// The built SSR entry, called the way renderAnimation calls it.
interface AnimationEntry {
  composeFrame(
    document: SnapshotDocument,
    host: FrameHost,
    editorId?: string,
  ): Promise<ComposedFrame>;
  renderAnimationScenes(
    document: SnapshotDocument,
    timing: AnimationTiming,
    host: AnimationHost,
  ): Promise<AnimationScenes>;
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

// The second step outgrows the target, so its window scales down.
const targetTabs: SnapshotDocument = {
  ...twoTabs,
  frame: {
    ...twoTabs.frame,
    exportTarget: 'x-landscape',
    signature: {
      handle: 'octocat',
      name: 'The Octocat',
      style: 'card',
      platform: 'github',
      avatar: null,
      position: 'bottom-center',
      profile: null,
      savedId: null,
    },
  },
  editor: {
    ...twoTabs.editor,
    editors: [
      twoTabs.editor.editors[0],
      {
        ...twoTabs.editor.editors[1],
        code: Array.from({length: 40}, (_, line) => `const v${line} = 1;`).join(
          '\n',
        ),
      },
    ],
  },
};

// Lays out at a pixel ratio of 1, so the host works in CSS pixels.
async function setup(document: SnapshotDocument) {
  const [entry, stylesheet, markup] = await Promise.all([
    import(
      new URL('ssr/entry-server.js', dist).href
    ) as Promise<AnimationEntry>,
    readFile(new URL('ssr/assets/style.css', dist), 'utf8'),
    snapshotMarkup(document),
  ]);
  const renderer = new Renderer();
  for (const font of markup.fonts) {
    await renderer.registerFont({
      name: font.family,
      data: font.data,
      weight: font.weight,
      unicodeRange: font.unicodeRange,
    });
  }
  const {fontFamilies} = markup;
  const page = (markup: FrameMarkup) => ({
    css: [...markup.css, stylesheet],
    images: markup.images,
    fontFamilies,
  });
  const host: AnimationHost = {
    offline: true,
    async measure(markup) {
      const {width, height} = await renderer.measure(markup.html, page(markup));
      return {width, height};
    },
    layout: markup => renderer.measure(markup.html, page(markup)),
    pixels: (markup, size) =>
      renderer.render(markup.html, {
        css: markup.css,
        images: markup.images,
        width: size,
        height: size,
        format: 'raw',
        devicePixelRatio: 1,
      }),
  };
  const sceneAt = (
    animation: AnimationScenes,
    scene: number,
    timeMs: number,
  ): Promise<MeasuredNode> =>
    renderer.measure(animation.scenes[scene].html, {
      css: [...animation.css, stylesheet],
      fontFamilies,
      timeMs: Math.min(timeMs, animation.scenes[scene].durationMs),
      width: animation.width,
      height: animation.height,
    });
  // The watermark of a static export, as createRenderer places it.
  const place = (frame: ComposedFrame) =>
    positionWatermark({
      html: frame.html,
      ...frame.watermarkFrame,
      measure: html =>
        renderer.measure(html, {
          ...page(frame),
          width: frame.size.width,
          height: frame.size.height,
        }),
    });
  return {entry, host, sceneAt, place};
}

const steps = (...editorIds: string[]) =>
  editorIds.map(editorId => ({editorId, holdMs: 500})) as [
    {editorId: string; holdMs: number},
  ];

const timing = (...editorIds: string[]): AnimationTiming => ({
  steps: steps(...editorIds),
  transitionMs: 900,
  easing: 'linear',
  fps: 30,
});

// html > body > scene > preview wrapper > frame
const frameOf = (root: MeasuredNode) =>
  root.children[0].children[0].children[0].children[0];

// frame > fit viewport > fitted window
const windowOf = (root: MeasuredNode) => frameOf(root).children[1].children[0];

const box = (node: MeasuredNode) => ({
  x: node.transform[4],
  y: node.transform[5],
  width: node.width * node.transform[0],
  height: node.height * node.transform[3],
});

const bodyOf = (html: string) =>
  html.replace(/^<html><body>|<\/body><\/html>$/g, '');

describe('renderAnimationScenes', {timeout: 30_000}, () => {
  it('gives each scene its own frame and switches the active tab halfway', async () => {
    const {entry, host, sceneAt} = await setup(twoTabs);
    const animation = await entry.renderAnimationScenes(
      parseSnapshotDocument(twoTabs),
      timing('a', 'b'),
      host,
    );
    expect(animation.scenes.map(scene => scene.durationMs)).toEqual([
      500, 450, 450, 500,
    ]);
    expect(animation.scenes.map(({kind, step}) => [kind, step])).toEqual([
      ['hold', 0],
      ['transition', 0],
      ['transition', 1],
      ['hold', 1],
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

    const frameAt = async (scene: number, timeMs: number) =>
      box(frameOf(await sceneAt(animation, scene, timeMs)));
    const [first, last] = [await frameAt(0, 0), await frameAt(3, 0)];
    expect(first.height).toBeLessThan(last.height);
    expect(await frameAt(1, 0)).toEqual(first);
    expect(await frameAt(2, 450)).toEqual(last);
  });

  it('times a transition by the step it leads into and draws the stored header in every scene', async () => {
    const {entry, host} = await setup(twoTabs);
    const document = parseSnapshotDocument(twoTabs);
    const play = (header: AnimationTiming['header']) =>
      entry.renderAnimationScenes(
        document,
        {
          ...timing('a', 'b', 'a'),
          steps: [
            {editorId: 'a', holdMs: 500},
            {
              editorId: 'b',
              holdMs: 500,
              transition: {ms: 300, easing: 'strong'},
            },
            {editorId: 'a', holdMs: 500},
          ],
          header,
        },
        host,
      );
    const tab = await play({mode: 'tab', title: ''});
    expect(tab.scenes.map(scene => scene.durationMs)).toEqual([
      500, 150, 150, 500, 450, 450, 500,
    ]);
    const names = (html: string) =>
      ['hello.ts', 'two.ts', 'A story'].filter(name => html.includes(name));
    expect(tab.scenes.map(({html}) => names(html))).toEqual([
      ['hello.ts'],
      ['hello.ts'],
      ['two.ts'],
      ['two.ts'],
      ['two.ts'],
      ['hello.ts'],
      ['hello.ts'],
    ]);
    const tabs = await play({mode: 'tabs', title: ''});
    for (const {html} of tabs.scenes)
      expect(names(html)).toEqual(['hello.ts', 'two.ts']);
    const title = await play({mode: 'title', title: 'A story'});
    for (const {html} of title.scenes) {
      expect(names(html)).toEqual(['A story']);
      expect(html).toContain('data-animation-title');
    }
  });

  it('holds the static export of each tab', async () => {
    for (const input of [twoTabs, targetTabs]) {
      const {entry, host} = await setup(input);
      const document = parseSnapshotDocument(input);
      const animation = await entry.renderAnimationScenes(
        document,
        timing('a', 'b'),
        host,
      );
      for (const [scene, step, editorId] of [
        [0, 0, 'a'],
        [3, 1, 'b'],
      ] as const) {
        const frame = await entry.composeFrame(document, host, editorId);
        expect(animation.scenes[scene].html).toContain(bodyOf(frame.html));
        expect(animation.steps[step]).toEqual({
          ...frame,
          exactSize: expect.objectContaining({}),
        });
      }
    }
  });

  it('starts and ends a target transition on the windows of its holds', async () => {
    const {entry, host, sceneAt} = await setup(targetTabs);
    const animation = await entry.renderAnimationScenes(
      parseSnapshotDocument(targetTabs),
      timing('a', 'b'),
      host,
    );
    expect([animation.width, animation.height]).toEqual([1600, 900]);
    const windowAt = async (scene: number, timeMs: number) =>
      box(windowOf(await sceneAt(animation, scene, timeMs)));
    const [from, to] = [await windowAt(0, 0), await windowAt(3, 0)];
    expect(to.height).toBeGreaterThan(from.height);
    for (const [actual, expected] of [
      [await windowAt(1, 0), from],
      [await windowAt(2, 450), to],
    ]) {
      for (const key of ['x', 'y', 'width', 'height'] as const)
        expect(actual[key]).toBeCloseTo(expected[key], 1);
    }
  });

  it('gives every scene the watermark of its step', async () => {
    // The last line of the second tab runs under the watermark's home.
    const input: SnapshotDocument = {
      ...twoTabs,
      editor: {
        ...twoTabs.editor,
        editors: [
          twoTabs.editor.editors[0],
          {
            ...twoTabs.editor.editors[1],
            code: `const a = 1;\nconst long = [${Array(24).fill('a').join(', ')}];`,
          },
        ],
      },
    };
    const {entry, host, place} = await setup(input);
    const document = parseSnapshotDocument(input);
    const animation = await entry.renderAnimationScenes(
      document,
      timing('a', 'b'),
      host,
    );
    const scenes = await watermarkScenes(animation, place);
    const placed = await Promise.all(
      ['a', 'b'].map(async id =>
        place(await entry.composeFrame(document, host, id)),
      ),
    );
    const slotOf = (html: string) =>
      /data-watermark-placement="([\w-]+)"/.exec(html)?.[1];
    const [, slot] = placed.map(slotOf);
    expect(slotOf(placed[0])).toBe('home');
    expect(slot).toMatch(/-right$/);
    expect(scenes.map(({html}) => slotOf(html))).toEqual([
      'home',
      'home',
      slot,
      slot,
    ]);
    // A hold is the static export, mark included.
    const inner = (html: string, from: string, to: string) =>
      html.slice(html.indexOf(from) + from.length, html.lastIndexOf(to));
    expect(
      inner(scenes[3].html, '<div data-animation-scene="3">', '</div></body>'),
    ).toEqual(inner(placed[1], '<body>', '</body>'));
    // A transition keeps the moved mark at its corner of a resizing frame.
    expect(scenes[2].html).toContain(
      '<div data-watermark-anchor="" style="position:absolute;right:0;',
    );
    expect(scenes[2].html).toContain(`<div data-watermark-moved="${slot}"`);
  });

  it('names a step whose tab is gone', async () => {
    const {entry, host} = await setup(twoTabs);
    await expect(
      entry.renderAnimationScenes(
        parseSnapshotDocument(twoTabs),
        timing('a', 'gone'),
        host,
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

// Two tabs of one size with line numbers. Their middle line is removed in the
// first tab and added in the second.
const markedSteps = (): AnimationInput => {
  const {format, ...base} = plainDocument('', {showLineNumbers: true});
  const [tab] = base.editor.editors;
  const step = (id: string, middle: string, kind: 'added' | 'removed') => ({
    ...tab,
    id,
    tabName: `${id}.ts`,
    code: `const a = 1;\n${middle}\nconst c = 3;`,
    marks: {lines: [{line: 2, kind}], focusedLines: []},
  });
  return {
    ...base,
    scale: 1,
    format: 'apng',
    editor: {
      ...base.editor,
      editors: [
        step('first', 'const b = 2;', 'removed'),
        step('second', 'const d = 4;', 'added'),
      ],
    },
  };
};

const differingPixels = (frame: PNG, image: PNG) => {
  expect([frame.width, frame.height]).toEqual([image.width, image.height]);
  let count = 0;
  for (let i = 0; i < frame.data.length; i += 4) {
    if (frame.data.compare(image.data, i, i + 4, i, i + 4)) count++;
  }
  return count;
};

// Pixels of the still that differ in the frame, where the still sits
// centered in it.
const differingCentered = (frame: PNG, image: PNG) => {
  const left = Math.floor((frame.width - image.width) / 2);
  const top = Math.floor((frame.height - image.height) / 2);
  let count = 0;
  for (let y = 0; y < image.height; y++) {
    for (let x = 0; x < image.width; x++) {
      const at = (y * image.width + x) * 4;
      const there = ((y + top) * frame.width + x + left) * 4;
      if (image.data.compare(frame.data, there, there + 4, at, at + 4)) count++;
    }
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
    expect(sum(webp.durationsMs)).toBe(800 + 700 + 800);
    // WebP stores equal neighbors as one frame, so each hold is one frame
    // that may take in the still ends of the transition. The transition is
    // 21 frames at 30 fps.
    expect(webp.durationsMs.at(0)).toBeGreaterThanOrEqual(800);
    expect(webp.durationsMs.at(-1)).toBeGreaterThanOrEqual(800);
    expect(webp.durationsMs.length).toBeGreaterThan(15);
    expect(webp.durationsMs.length).toBeLessThanOrEqual(23);
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

  it('draws the line marks of the first and the last frame like the still of each step', async () => {
    const input = markedSteps();
    const frames = decodeApng(await renderAnimation(input));
    expect(differingPixels(frames[0], await still(input, 0))).toBe(0);
    expect(differingPixels(frames.at(-1)!, await still(input, 1))).toBe(0);
  });

  it('places the watermark of each step like its still', async () => {
    // The second step's last line runs under the watermark's home.
    const input = steps2([
      SHORT,
      `${TALL}\n${Array(40).fill('wide').join(' ')}`,
    ]);
    input.terminal = {...input.terminal, showWatermark: true};
    const frames = decodeApng(
      await renderAnimation({...input, format: 'apng'}),
    );
    expect(differingCentered(frames[0], await still(input, 0))).toBe(0);
    expect(differingCentered(frames.at(-1)!, await still(input, 1))).toBe(0);
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
    [24, 40],
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

  it('drops a step whose tab is gone, as the editor does', async () => {
    const webp = readWebpAnimation(
      await renderAnimation(
        steps2([SHORT, TALL], {
          steps: [
            {editorId: 'gone', holdMs: 100},
            {editorId: 'second', holdMs: 300},
          ],
          transitionMs: 100,
          easing: 'linear',
          fps: 30,
        }),
      ),
    );
    expect(sum(webp.durationsMs)).toBe(300);
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
  it('plays GIF at 50 or 25 fps, as the web export does', () => {
    expect([24, 30, 50, 60].map(fps => animationFps('gif', fps))).toEqual([
      25, 25, 50, 50,
    ]);
  });
});
