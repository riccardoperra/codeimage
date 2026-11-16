import type {WebHost} from './web-host';
import {
  parseSnapshotDocument,
  renderSnapshot,
} from '../../../packages/render/dist/index.mjs';
import type {PNG} from 'pngjs';
import {last} from '../lib';
import {type Case, type Args, settings} from './types';
import {diffPercent, crop} from './paint-checks';
import {inCssPixels, codeBoxPath} from './layout-checks';
export async function prepareCase(
  {name, input, identity}: Case,
  args: Args,
  web: WebHost,
) {
  const document = parseSnapshotDocument(input);
  const {scale} = document;
  await web.useDocument(document);
  const {
    entry,
    host,
    staticExport,
    withWatermarks,
    renderer,
    normalizeStyleAttributes,
    pageCss,
    fontFamilies,
    fonts,
    decode,
  } = web;
  const [first] = document.editor.editors.map(({id}) => id);
  const reference = await diffPercent(
    decode((await renderSnapshot(input)) as Uint8Array),
    await staticExport(document, first),
  );
  const animation = await withWatermarks(
    await entry.renderAnimationScenes(document, settings, host(scale)),
    scale,
  );
  const [fromHold, early, late, toHold] = animation.scenes;
  if (args.shift) {
    const [layer, pixels] = args.shift.split(':');
    const moved = {
      code: '.cm-content > .cm-line > div:last-child',
      gutter: '.cm-gutterElement > div',
    }[layer];
    if (!moved) throw new Error(`cannot shift ${layer}`);
    animation.css.push(`[data-animation-scene="1"] ${moved}{left:${pixels}px}`);
  }
  const frameAt = async (scene: {html: string}, timeMs: number) =>
    decode(
      await renderer.render(normalizeStyleAttributes(scene.html), {
        width: animation.width * scale,
        height: animation.height * scale,
        css: pageCss(animation.css),
        images: animation.images,
        fontFamilies,
        fonts,
        format: 'png',
        devicePixelRatio: scale,
        timeMs,
      }),
    );

  const fromHoldImage = await frameAt(fromHold, 0);
  const toHoldImage = await frameAt(toHold, 0);

  const origin = (reference: PNG) => ({
    x: Math.floor((animation.width - reference.width / scale) / 2) * scale,
    y: Math.floor((animation.height - reference.height / scale) / 2) * scale,
  });
  const centered = (frame: PNG, reference: PNG) => {
    const {x, y} = origin(reference);
    return crop(frame, {
      x,
      y,
      width: reference.width,
      height: reference.height,
    });
  };
  const layoutAt = async (scene: {html: string}, timeMs: number) =>
    inCssPixels(
      await renderer.measure(normalizeStyleAttributes(scene.html), {
        width: animation.width * scale,
        height: animation.height * scale,
        css: pageCss(animation.css),
        images: animation.images,
        fontFamilies,
        fonts,
        devicePixelRatio: scale,
        timeMs,
      }),
      scale,
    );

  const frameOf = async (scene: {html: string}, timeMs: number) =>
    last(
      (await layoutAt(scene, timeMs)).children[0].children[0].children[0]
        .children,
    ).children[0];
  const frameSize = async (scene: {html: string}, timeMs: number) => {
    const frame = await frameOf(scene, timeMs);
    return `${Math.round(frame.width)}x${Math.round(frame.height)}`;
  };
  const [from, to] = document.editor.editors;
  const fromLayout = await layoutAt(fromHold, 0);
  const toLayout = await layoutAt(toHold, 0);

  const path =
    codeBoxPath(fromLayout, from.code) ?? codeBoxPath(toLayout, to.code);
  return {
    name,
    input,
    identity,
    document,
    scale,
    layoutScale: Number(args.scale),
    reference,
    animation,
    fromHold,
    early,
    late,
    toHold,
    frameAt,
    fromHoldImage,
    toHoldImage,
    origin,
    centered,
    layoutAt,
    frameOf,
    frameSize,
    from,
    to,
    fromLayout,
    toLayout,
    path,
    web,
  };
}

export type Prepared = Awaited<ReturnType<typeof prepareCase>>;
