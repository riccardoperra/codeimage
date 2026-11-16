import init, {Renderer} from '@takumi-rs/wasm';
import wasmUrl from '@takumi-rs/wasm/wasm-url';
import {padVideoFrame, errorMessage} from '../core/video/encode';
import {
  ANIMATION_FORMATS,
  checkAnimationSupport,
  createAnimationEncoder,
  warmAnimationEncoder,
} from '../core/video/formats';
import {paletteFrameIndices, palettePixels} from '../core/gif/encode';
import type {
  AnimationEvent,
  AnimationFailure,
  AnimationExport,
  AnimationRequest,
} from '../core/video/protocol';

const send = (event: AnimationEvent, transfer: Transferable[] = []) =>
  self.postMessage(event, {transfer});
let cancelled = false;
let warming = Promise.resolve();

async function exportAnimation(job: AnimationExport) {
  const started = performance.now();
  let reason: Extract<AnimationFailure, 'renderer' | 'fonts' | 'encoder'> =
    'renderer';
  let encoder: Awaited<ReturnType<typeof createAnimationEncoder>> | undefined;
  try {
    await warming;
    try {
      await init({module_or_path: wasmUrl});
    } catch (error) {
      throw new Error(`Takumi WASM: ${errorMessage(error)}`);
    }
    const renderer = new Renderer();
    reason = 'fonts';
    for (const font of job.resources.fonts) await renderer.registerFont(font);
    reason = 'encoder';
    const support = await checkAnimationSupport(job.config);
    if (support.kind === 'unsupported')
      throw new Error(`H.264 configuration unavailable (${support.reason})`);
    const durationMs = job.scenes.reduce(
      (sum, scene) => sum + scene.durationMs,
      0,
    );
    const total = Math.ceil((durationMs * job.config.fps) / 1000);
    const options = {
      width: job.config.width,
      height: job.config.height,
      devicePixelRatio: job.pixelRatio,
      css: [...job.resources.css, job.css],
      fontFamilies: job.resources.fontFamilies,
    };
    let renderMs = 0;
    const render = async (index: number) => {
      const timeMs = Math.floor((index * 1000) / job.config.fps);
      let sceneIndex = 0;
      let sceneStart = 0;
      while (
        sceneIndex < job.scenes.length - 1 &&
        timeMs >= sceneStart + job.scenes[sceneIndex].durationMs
      ) {
        sceneStart += job.scenes[sceneIndex++].durationMs;
      }
      reason = 'renderer';
      const before = performance.now();
      const rgba = await renderer.render(job.scenes[sceneIndex].html, {
        ...options,
        css: [...options.css, job.scenes[sceneIndex].css],
        timeMs: timeMs - sceneStart,
        format: 'raw',
      });
      renderMs += performance.now() - before;
      padVideoFrame(rgba, job.contentSize, job.config);
      return rgba;
    };
    const indices = ANIMATION_FORMATS[job.config.kind].paletteSamples
      ? paletteFrameIndices(job.scenes, job.config.fps)
      : [];
    send({kind: 'progress', done: 0, total});
    const samples: Uint8Array[] = [];
    for (const index of indices) {
      await new Promise<void>(resolve => setTimeout(resolve, 0));
      if (cancelled) return;
      samples.push(palettePixels(await render(index), indices.length));
    }
    reason = 'encoder';
    encoder = await createAnimationEncoder(job.config, samples);
    samples.length = 0;
    for (let index = 0; index < total; index++) {
      // Takumi and gifenc may resolve synchronously. A microtask cannot
      // receive Cancel; yield to the worker's message queue every 3 frames.
      if (index % 3 === 0)
        await new Promise<void>(resolve => setTimeout(resolve, 0));
      if (cancelled) return;
      const rgba = await render(index);
      reason = 'encoder';
      await encoder.add(rgba, index);
      if (index % 3 === 0 || index === total - 1)
        send({
          kind: 'progress',
          done: index + 1,
          total,
        });
    }
    const buffer = await encoder.finish();
    if (!cancelled)
      send(
        {
          kind: 'done',
          buffer,
          frames: total,
          durationMs: (total * 1000) / job.config.fps,
          renderMs,
          elapsedMs: performance.now() - started,
        },
        [buffer],
      );
  } catch (error) {
    if (!cancelled) send({kind: 'failed', reason, cause: errorMessage(error)});
  } finally {
    await encoder?.close();
  }
}

self.onmessage = ({data}: MessageEvent<AnimationRequest>) => {
  switch (data.kind) {
    case 'warm':
      // Warming is advisory. A failed real encode is reported by the job.
      warming = warmAnimationEncoder(data.config).catch(() => undefined);
      void warming.then(() => send({kind: 'warmed'}));
      break;
    case 'cancel':
      cancelled = true;
      send({kind: 'cancelled'});
      self.close();
      break;
    case 'export':
      cancelled = false;
      void exportAnimation(data.job);
      break;
  }
};
