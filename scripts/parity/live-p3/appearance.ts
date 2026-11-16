import {
  renderSnapshot,
  supportedThemeIds,
} from '../../../packages/render/dist/index.mjs';
import {PNG} from 'pngjs';
import pixelmatch from 'pixelmatch';
import {PIXELMATCH_THRESHOLD} from '../lib';
import {lane, png, snapshot, save, sheet, pixel} from './helpers';
export async function lane0() {
  return await lane('2 themes', async () => {
    const themes = await supportedThemeIds();
    const images = [];
    for (const themeId of themes) {
      images.push(await png(snapshot({options: {themeId}})));
    }
    await save('p3-themes.png', sheet(images, 6));
    return {
      pass: images.length === themes.length,
      themes: themes.length,
      note: 'per-theme parity is the takumi-vs-chrome table',
    };
  });
}
export async function lane1() {
  return await lane('3 background image', async () => {
    const tile = new PNG({width: 64, height: 64});
    for (let y = 0; y < 64; y++) {
      for (let x = 0; x < 64; x++) {
        const i = (y * 64 + x) * 4;
        tile.data.set([x * 4, 40, y * 4, 255], i);
      }
    }
    const dataUrl = `data:image/png;base64,${PNG.sync.write(tile).toString('base64')}`;
    const image = await png(snapshot({frame: {background: `link:${dataUrl}`}}));
    await save('p3-bg-image.png', image);
    const topLeft = pixel(image, 4, 4);
    const bottomRight = pixel(image, image.width - 5, image.height - 5);
    const asset = await renderSnapshot(
      snapshot({frame: {background: 'asset:local-upload'}}),
    ).catch((error: Error) => error.message);
    return {
      pass:
        topLeft[1] === 40 &&
        bottomRight[1] === 40 &&
        bottomRight[0] > topLeft[0] &&
        String(asset).includes('asset:local-upload'),
      topLeft,
      bottomRight,
      browserAsset: asset,
    };
  });
}
export async function lane2() {
  return await lane('4 emoji and CJK', async () => {
    const text = (code: string) =>
      png(snapshot({editor: {code}, terminal: {showWatermark: false}}));
    const [cjk, boxes, blank, emoji] = await Promise.all([
      text('const 你好 = "世界";'),
      text('const \uE000\uE001 = "\uE002\uE003";'),
      text('const    = "  ";'),
      text('const ok = "🎉🚀";'),
    ]);
    await save('p3-fallback.png', sheet([cjk, emoji], 1));
    const ink = (image: PNG) =>
      pixelmatch(image.data, blank.data, null, image.width, image.height, {
        threshold: PIXELMATCH_THRESHOLD,
      });
    const colored = (image: PNG) => {
      let count = 0;
      for (let i = 0; i < image.data.length; i += 4) {
        const [r, g, b] = image.data.subarray(i, i + 3);
        if (Math.max(r, g, b) - Math.min(r, g, b) > 150) count++;
      }
      return count;
    };
    const cjkInk = ink(cjk);
    const boxInk = ink(boxes);
    const emojiColor = colored(emoji) - colored(blank);
    return {
      pass: cjkInk > boxInk * 1.2 && emojiColor > 20,
      cjkInk,
      missingGlyphBoxInk: boxInk,
      emojiColoredPixels: emojiColor,
    };
  });
}
