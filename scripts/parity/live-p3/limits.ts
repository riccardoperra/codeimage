import {renderSnapshot} from '../../../packages/render/dist/index.mjs';
import {writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {PNG} from 'pngjs';
import {lane, png, snapshot, save, sheet, out, lastInkRow} from './helpers';
export async function lane6() {
  return await lane('8 scale', async () => {
    const sizes = [];
    const images = [];
    for (const scale of [1, 2, 3]) {
      const image = await png(snapshot({}, {scale}));
      images.push(image);
      sizes.push([image.width, image.height]);
    }
    await save('p3-scale.png', sheet(images, 3));
    const [[w, h]] = sizes;
    return {
      pass: sizes.every(
        ([sw, sh], i) => sw === w * (i + 1) && sh === h * (i + 1),
      ),
      sizes,
    };
  });
}
export async function lane7() {
  return await lane('9 bad version', async () => {
    const message = await renderSnapshot(snapshot({}, {$version: 999})).then(
      () => 'rendered',
      (error: Error) => error.message,
    );
    await writeFile(join(out, 'p3-bad-version.txt'), `${message}\n`);
    return {pass: message.includes('999'), message};
  });
}
export async function lane8() {
  return await lane('10 huge', async () => {
    const code = Array.from(
      {length: 1000},
      (_, n) => `const line${n + 1} = ${n + 1};`,
    ).join('\n');
    const document = snapshot({
      editor: {code},
      options: {showLineNumbers: true},
    });
    const atDefaultScale = await renderSnapshot({...document, scale: 2}).then(
      bytes => `rendered ${(bytes as Uint8Array).byteLength} bytes`,
      (error: Error) => error.message,
    );
    const image = await png(document);
    await save('p3-huge.png', image);
    const tail = new PNG({width: image.width, height: 400});
    PNG.bitblt(image, tail, 0, image.height - 400, image.width, 400, 0, 0);
    await save('p3-huge-tail.png', tail);
    const gutterEnd = lastInkRow(image, 105, 138, 150);
    const codeEnd = lastInkRow(image, 160, 200, 150);
    return {
      pass: image.height > 1000 * 22 && Math.abs(gutterEnd - codeEnd) < 22,
      gutterEnd,
      codeEnd,
      scale1Size: [image.width, image.height],
      scale2: atDefaultScale,
    };
  });
}
