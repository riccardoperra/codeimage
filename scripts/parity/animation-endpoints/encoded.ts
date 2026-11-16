import {last} from '../lib';
import {frameTimeMs} from './types';
import type {PNG} from 'pngjs';
import type {Prepared} from './prepare';
import {
  animationFps,
  renderAnimation,
} from '../../../packages/render/dist/index.mjs';
import {join} from 'node:path';
import {writeFile} from 'node:fs/promises';
import {decodeAnimation} from '../animation-frames';
import {type Args, settings} from './types';
import {diffPercent} from './paint-checks';
export async function checkEncoded(
  {name, input, document, scale, animation, web}: Prepared,
  args: Args,
) {
  const {
    withWatermarks,
    entry,
    host,
    renderer,
    normalizeStyleAttributes,
    pageCss,
    fontFamilies,
    fonts,
    decode,
  } = web;
  const out = args.out;
  const encoded: Record<string, string> = {};
  let encodedDiff = 0;
  let ghosts = 0;
  if (args.encode) {
    for (const format of ['webp', 'gif', 'apng'] as const) {
      const fps = animationFps(format, settings.fps);
      const file = join(out, `${name}.${format}`);
      await writeFile(
        file,
        await renderAnimation({...input, format, animation: settings}),
      );

      const played =
        fps === settings.fps
          ? animation
          : await withWatermarks(
              await entry.renderAnimationScenes(
                document,
                {...settings, fps},
                host(scale),
              ),
              scale,
            );
      const sceneAt = (ms: number) => {
        let start = 0;
        for (const scene of played.scenes) {
          if (ms < start + scene.durationMs) return {scene, timeMs: ms - start};
          start += scene.durationMs;
        }
        const finalScene = last(played.scenes);
        return {scene: finalScene, timeMs: finalScene.durationMs};
      };
      const renderAt = async (scene: {html: string}, timeMs: number) =>
        decode(
          await renderer.render(normalizeStyleAttributes(scene.html), {
            width: played.width * scale,
            height: played.height * scale,
            css: pageCss(played.css),
            images: played.images,
            fontFamilies,
            fonts,
            format: 'png',
            devicePixelRatio: scale,
            timeMs,
          }),
        );
      const decoded = await decodeAnimation(file);
      let worst = 0;

      let [ghost, holes] = [0, 0];
      for (const {png, startMs} of decoded.frames) {
        const index = Math.round((startMs * fps) / 1000);
        const {scene, timeMs} = sceneAt(frameTimeMs(index, fps));
        const direct = await renderAt(scene, timeMs);
        worst = Math.max(worst, await diffPercent(png, direct));
        if (format !== 'gif') continue;
        const counts = alphaDifferences(png, direct);
        ghost += counts.ghost;
        holes += counts.holes;
      }
      encoded[format] =
        `${decoded.frames.length}f ${worst.toFixed(3)}${format === 'gif' ? ` ${ghost} ghost ${holes} hole px` : ''}`;

      if (format === 'gif') ghosts = ghost;
      else encodedDiff = Math.max(encodedDiff, worst);
    }
  }
  return {encoded, encodedDiff, ghosts};
}

function alphaDifferences(png: PNG, direct: PNG) {
  let ghost = 0,
    holes = 0;
  for (let alpha = 3; alpha < png.data.length; alpha += 4) {
    const [shown, drawn] = [png.data[alpha], direct.data[alpha]];
    if (shown && !drawn) ghost++;
    if (!shown && drawn) holes++;
  }
  return {ghost, holes};
}
