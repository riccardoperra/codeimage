import {watermarkScenes} from './animationWatermark';
import {clearGifFrames} from './gif';

import type {AnimationDocument, AnimationInput} from './document';
import {parseAnimationDocument} from './document';

import type {RendererOptions, RawAnimation} from './renderTypes';
import type {OpenRenderer} from './renderRuntime';
import {normalizeStyleAttributes} from './renderRuntime';

export function animationFps(
  format: AnimationDocument['format'],
  fps: number,
): number {
  if (format !== 'gif') return fps;
  return fps >= 50 ? 50 : 25;
}

export function createAnimationRenderer(
  open: OpenRenderer,
  options: RendererOptions,
) {
  async function animate(input: AnimationInput): Promise<Uint8Array> {
    const document = parseAnimationDocument(input);
    const opened = await open(document);
    const {entry, renderer, fonts, fontFamilies, scale, pageCss} = opened;
    const fps = animationFps(document.format, document.animation.fps);
    const animation = await entry.renderAnimationScenes(
      document,
      {...document.animation, fps},
      opened.host,
    );
    const scenes = await watermarkScenes(animation, opened.placeWatermark);
    const image = await renderer.renderAnimation({
      scenes: scenes.map(({html, durationMs}) => ({
        node: normalizeStyleAttributes(html),
        durationMs,
      })),
      width: Math.floor(animation.width * scale),
      height: Math.floor(animation.height * scale),
      css: pageCss(animation.css),
      images: animation.images,
      fontFamilies,
      fonts,
      fps,
      format: document.format,
      devicePixelRatio: scale,
      signal: options.signal,
    });
    const bytes = new Uint8Array(
      image.buffer,
      image.byteOffset,
      image.byteLength,
    );
    if (document.format === 'gif') clearGifFrames(bytes);
    return bytes;
  }

  return {
    async animationFrames(input: AnimationInput): Promise<RawAnimation> {
      const document = parseAnimationDocument(input);
      const opened = await open(document);
      const {entry, renderer, fonts, fontFamilies, scale, pageCss} = opened;
      const fps = document.animation.fps;
      const animation = await entry.renderAnimationScenes(
        document,
        {...document.animation, fps},
        opened.host,
      );
      const scenes = await watermarkScenes(animation, opened.placeWatermark);
      const width = Math.floor(animation.width * scale);
      const height = Math.floor(animation.height * scale);
      const durationMs = scenes.reduce(
        (sum, scene) => sum + scene.durationMs,
        0,
      );
      return {
        width,
        height,
        fps,
        durationMs,
        frames: (async function* () {
          let index = 0;
          let startMs = 0;
          for (const scene of scenes) {
            const html = normalizeStyleAttributes(scene.html);
            const endMs = startMs + scene.durationMs;
            let held: Uint8Array | undefined;
            while ((index * 1000) / fps < endMs) {
              options.signal?.throwIfAborted();
              const rgba =
                held ??
                (await renderer.render(html, {
                  css: pageCss(animation.css),
                  images: animation.images,
                  fontFamilies,
                  fonts,
                  width,
                  height,
                  format: 'raw',
                  devicePixelRatio: scale,
                  timeMs: Math.floor((index * 1000) / fps) - startMs,
                  signal: options.signal,
                }));
              if (scene.kind === 'hold') held = rgba;
              yield {width, height, rgba};
              index++;
            }
            startMs = endMs;
          }
        })(),
      };
    },
    renderAnimation: animate,
  };
}
