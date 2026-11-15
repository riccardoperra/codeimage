import {readFile} from 'node:fs/promises';
import type {MeasuredNode} from '@takumi-rs/core';
import {Renderer} from '@takumi-rs/core';
import {describe, expect, it} from 'vitest';
import {parseSnapshotDocument, type SnapshotDocument} from './document';
import {snapshotMarkup} from './render';
import {sampleDocument} from './sample';

// A2 wraps renderAnimationScenes in this package. Until then the test calls
// the built SSR entry the way A2 will.
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
