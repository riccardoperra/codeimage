import {
  renderSnapshot,
  supportedFontIds,
} from '../../../packages/render/dist/index.mjs';
import {join} from 'node:path';
import {writeFile} from 'node:fs/promises';
import {chromium} from 'playwright';
import {PNG} from 'pngjs';
import {promisify} from 'node:util';
import {execFile} from 'node:child_process';
import {MAX_DIFF_PERCENT} from '../lib';
import {
  lane,
  snapshot,
  out,
  png,
  save,
  sheet,
  diffPercent,
  pixel,
} from './helpers';
export async function lane3() {
  return await lane('5 svg', async () => {
    const document = snapshot({}, {format: 'svg'});
    const svg = (await renderSnapshot(document)) as string;
    const svgPath = join(out, 'p3.svg');
    await writeFile(svgPath, svg);
    const reference = await png({...document, format: 'png'});
    const browser = await chromium.launch();
    const page = await browser.newPage();
    await page.setContent(
      `<!doctype html><body style="margin:0"><img src="data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}"></body>`,
    );
    await page
      .locator('img')
      .evaluate(img => (img as HTMLImageElement).decode());
    const chrome = PNG.sync.read(
      await page.locator('img').screenshot({omitBackground: true}),
    );
    await browser.close();
    await save('p3-svg.png', sheet([reference, chrome], 2));
    const percent = diffPercent(reference, chrome);
    let safari: string;
    try {
      await promisify(execFile)('qlmanage', [
        '-t',
        '-s',
        String(reference.width),
        '-o',
        out,
        svgPath,
      ]);
      safari = join(out, 'p3.svg.png');
    } catch (error) {
      safari = `not run: ${(error as Error).message.split('\n')[0]}`;
    }
    return {
      pass: !svg.includes('foreignObject') && percent <= MAX_DIFF_PERCENT,
      foreignObject: svg.includes('foreignObject'),
      chromeVersusPngPercent: percent,
      safariQuickLook: safari,
    };
  });
}
export async function lane4() {
  return await lane('6 opacity 50, radius 0', async () => {
    const image = await png(
      snapshot({frame: {opacity: 50, radius: 0}, terminal: {opacity: 50}}),
    );
    await save('p3-opacity.png', image);
    return {
      pass: pixel(image, 0, 0)[3] > 0 && pixel(image, 0, 0)[3] < 255,
      cornerAlpha: pixel(image, 0, 0)[3],
      note: 'the opacity cell of takumi-vs-chrome compares it with Chrome',
    };
  });
}
export async function lane5() {
  return await lane('7 fonts', async () => {
    const fontIds = await supportedFontIds();
    const images = [];
    for (const fontId of fontIds) {
      images.push(await png(snapshot({options: {fontId}})));
    }
    await save('p3-fonts.png', sheet(images, 4));
    const signatures = new Set(
      images.map(image => image.data.toString('base64')),
    );
    return {
      pass: signatures.size === fontIds.length,
      fonts: fontIds.length,
      distinctRenders: signatures.size,
    };
  });
}
