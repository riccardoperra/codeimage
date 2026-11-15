// @vitest-environment happy-dom
// @vitest-environment node
import {readFile} from 'node:fs/promises';
import init, {Renderer} from '@takumi-rs/wasm';
import {expect, it} from 'vitest';

it('treats width and height as output pixels at every device pixel ratio', async () => {
  const wasm = await readFile(
    new URL(import.meta.resolve('@takumi-rs/wasm/takumi_wasm_bg.wasm')),
  );
  await init({module_or_path: wasm});
  const renderer = new Renderer();
  try {
    for (const [width, height, devicePixelRatio] of [
      [120, 80, 1],
      [120, 80, 2],
      [240, 160, 2],
    ]) {
      const png = await renderer.render(
        '<div style="width:120px;height:80px;background:red"></div>',
        {width, height, devicePixelRatio},
      );
      const header = new DataView(png.buffer, png.byteOffset, png.byteLength);
      expect([header.getUint32(16), header.getUint32(20)]).toEqual([
        width,
        height,
      ]);
    }
  } finally {
    renderer.free();
  }
});
