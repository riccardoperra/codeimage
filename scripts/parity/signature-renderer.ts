import assert from 'node:assert/strict';
import {mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import path from 'node:path';
import pixelmatch from 'pixelmatch';
import {chromium} from 'playwright';
import {PNG} from 'pngjs';

async function main() {
  const out = process.env.SIGNATURE_OUT ?? '/tmp/codeimage-signature-renderer';
  const ratio = Number(process.env.SIGNATURE_RATIO ?? 1);
  const displayDpr = Number(process.env.SIGNATURE_DISPLAY_DPR ?? ratio);
  mkdirSync(out, {recursive: true});
  const worker = 'apps/codeimage/public/mockServiceWorker.js';
  const original = readFileSync(worker);
  writeFileSync(
    worker,
    readFileSync('apps/codeimage/node_modules/msw/lib/mockServiceWorker.js'),
  );
  const browser = await chromium.launch({
    headless: true,
    args: [`--force-device-scale-factor=${displayDpr}`],
  });
  const context = await browser.newContext({
    viewport: {width: 1440, height: 1200},
    deviceScaleFactor: displayDpr,
  });
  const page = await context.newPage();
  const session = await context.newCDPSession(page);
  const errors: string[] = [];
  const fallbacks: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => {
    if (message.text().includes('Takumi export failed'))
      fallbacks.push(message.text());
  });
  const results = [];
  const fontNetworkIssues: {url: string; error: string}[] = [];
  page.on('requestfailed', request => {
    if (/\.(woff2?|ttf|otf)\b/.test(request.url()))
      fontNetworkIssues.push({
        url: request.url(),
        error: request.failure()?.errorText ?? 'unknown',
      });
  });
  try {
    await page.goto(
      (process.env.SIGNATURE_URL ?? 'http://localhost:4403') + '/?v=2',
    );
    await page
      .locator('[data-static-code-view] .cm-line')
      .first()
      .waitFor({state: 'attached', timeout: 180000});
    for (const platform of process.env.SIGNATURE_ALL_ICONS
      ? ['x', 'bluesky', 'github', 'mastodon', 'linkedin']
      : [process.env.SIGNATURE_PLATFORM ?? 'github']) {
      for (const style of ['minimal', 'pill', 'card']) {
        for (const background of process.env.SIGNATURE_QUICK
          ? ['#202028']
          : ['#202028', '#f8fafc']) {
          for (const position of process.env.SIGNATURE_QUICK
            ? ['bottom-left']
            : ['bottom-left', 'bottom-center', 'bottom-right']) {
            const name = [platform, style, background.slice(1), position].join(
              '-',
            );
            const geometry = await page.evaluate(
              async data => {
                const {getFrameState} =
                  await import('/src/state/editor/frame.ts');
                const frame = getFrameState();
                frame.setExportTarget(data.ratio === 1 ? 'square' : null);
                frame.setWidth(1080);
                frame.setHeight(1080);
                const {getRootEditorStore} =
                  await import('/src/state/editor/index.ts');
                getRootEditorStore().actions.setFontId('geist-mono');
                frame.setBackground(data.background);
                frame.setSignature({
                  handle: 'codeimage',
                  name: 'CodeImage Developer',
                  style: data.style,
                  position: data.position,
                  platform: data.platform,
                  avatar: null,
                  profile: null,
                  savedId: null,
                });
                await document.fonts.ready;
                await new Promise<void>(resolve =>
                  requestAnimationFrame(() =>
                    requestAnimationFrame(() => resolve()),
                  ),
                );
                const styles =
                  await import('/src/components/Frame/Frame.css.ts');
                const wrapper = document.querySelector<HTMLElement>(
                  '.' + CSS.escape(styles.previewWrapper.split(' ')[0]),
                );
                const node = wrapper?.firstElementChild;
                const portal = wrapper?.parentElement;
                const mark = node?.querySelector('[data-signature-style] > *');
                if (!(node instanceof HTMLElement) || !portal || !mark)
                  throw new Error(
                    'Styled signature preview missing. Merge #729 first.',
                  );
                portal.style.opacity = '1';
                portal.style.zIndex = '99999';
                const bounds = node.getBoundingClientRect();
                const text = mark.getBoundingClientRect();
                return {
                  frame: {
                    x: bounds.x,
                    y: bounds.y,
                    width: bounds.width,
                    height: bounds.height,
                  },
                  crop: {
                    x: Math.floor(text.x - bounds.x) - 12,
                    y: Math.floor(text.y - bounds.y) - 12,
                    width: Math.ceil(text.width) + 24,
                    height: Math.ceil(text.height) + 24,
                  },
                };
              },
              {style, background, position, platform, ratio},
            );
            const {data} = await session.send('Page.captureScreenshot', {
              format: 'png',
              captureBeyondViewport: true,
              clip: {...geometry.frame, scale: ratio / displayDpr},
            });
            const chrome = PNG.sync.read(Buffer.from(data, 'base64'));
            const bytes = await page.evaluate(async ratio => {
              const styles = await import('/src/components/Frame/Frame.css.ts');
              const {exportImage} =
                await import('/src/hooks/use-export-image.ts');
              const wrapper = document.querySelector(
                '.' + CSS.escape(styles.previewWrapper.split(' ')[0]),
              );
              if (!(wrapper instanceof HTMLElement))
                throw new Error('Export frame missing');
              const blob = await exportImage({
                ref: wrapper,
                renderer: 'takumi',
                options: {
                  mode: 'getBlob',
                  extension: 'png',
                  pixelRatio: ratio,
                  quality: 1,
                },
              });
              if (!(blob instanceof Blob)) throw new Error('Expected a PNG');
              return Array.from(new Uint8Array(await blob.arrayBuffer()));
            }, ratio);
            const rendered = PNG.sync.read(Buffer.from(bytes));
            assert.equal(rendered.width, chrome.width);
            assert.equal(rendered.height, chrome.height);
            const {crop} = geometry;
            const width = crop.width * ratio;
            const height = crop.height * ratio;
            const reference = new PNG({width, height});
            const image = new PNG({width, height});
            PNG.bitblt(
              chrome,
              reference,
              crop.x * ratio,
              crop.y * ratio,
              width,
              height,
              0,
              0,
            );
            PNG.bitblt(
              rendered,
              image,
              crop.x * ratio,
              crop.y * ratio,
              width,
              height,
              0,
              0,
            );
            const diff = new PNG({width, height});
            const pixels = pixelmatch(
              reference.data,
              image.data,
              diff.data,
              width,
              height,
              {threshold: 0.1},
            );
            const percent = (100 * pixels) / (width * height);
            writeFileSync(
              path.join(out, name + '-chrome.png'),
              PNG.sync.write(reference),
            );
            writeFileSync(
              path.join(out, name + '-takumi.png'),
              PNG.sync.write(image),
            );
            writeFileSync(
              path.join(out, name + '-diff.png'),
              PNG.sync.write(diff),
            );
            results.push({
              platform,
              style,
              background,
              position,
              ratio,
              displayDpr,
              percent,
            });
            console.log(results.at(-1));
          }
        }
      }
    }
    assert.deepEqual(errors, []);
    assert.deepEqual(fallbacks, []);
    assert.ok(
      results.every(result => result.percent <= 0.5),
      'A signature crop differs from Chrome by more than 0.5%',
    );
  } finally {
    writeFileSync(
      path.join(out, 'results.json'),
      JSON.stringify({results, errors, fallbacks, fontNetworkIssues}, null, 2),
    );
    await browser.close();
    writeFileSync(worker, original);
  }
}

void main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
