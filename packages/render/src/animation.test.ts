import {readFile} from 'node:fs/promises';
import type {MeasuredNode} from '@takumi-rs/core';
import {Renderer} from '@takumi-rs/core';
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
import {parseSnapshotDocument, type SnapshotDocument} from './document';
import {snapshotMarkup} from './render';
import {sampleDocument} from './sample';
import './test-utils';
import {positionWatermark} from './watermarkGeometry';

// A2 wraps renderAnimationScenes in this package. Until then the test calls
// the built SSR entry the way A2 will.
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
