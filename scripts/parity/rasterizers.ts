import assert from 'node:assert/strict';
import {existsSync, mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import {homedir} from 'node:os';
import path from 'node:path';
import pixelmatch from 'pixelmatch';
import {chromium, type Page} from 'playwright';
import {PNG} from 'pngjs';

declare global {
  interface Window {
    fontProbeState: {queries: number; blobs: string[]};
  }
}

async function main() {
  const root = path.resolve(__dirname, '../..');
  const out = process.env.P2_OUT ?? '/tmp/swarm-p2';
  const baseUrl = process.env.P2_URL ?? 'http://localhost:4402';
  const quick = process.env.P2_QUICK === '1';
  const displayDpr = Number(process.env.P2_DISPLAY_DPR ?? 2);
  const executablePath =
    process.env.CHROMIUM_PATH ??
    path.join(
      homedir(),
      'Library/Caches/ms-playwright/chromium-1200/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing',
    );
  mkdirSync(out, {recursive: true});
  // Emulated deviceScaleFactor alone lays out in CSS pixels and snaps text
  // baselines to whole CSS pixels. A native factor matches a Retina display.
  const browser = await chromium.launch({
    executablePath,
    headless: process.env.P2_HEADED !== '1',
    args: [`--force-device-scale-factor=${displayDpr}`],
  });
  const context = await browser.newContext({
    viewport: {width: 1440, height: 1000},
    deviceScaleFactor: displayDpr,
    permissions: ['clipboard-read', 'clipboard-write'],
  });
  const page = await context.newPage();
  const screenshotSession = await context.newCDPSession(page);
  const errors: string[] = [];
  const fallback: string[] = [];
  const wasmRequests: string[] = [];
  page.on('pageerror', error => {
    errors.push(error.stack ?? error.message);
    console.error(error.stack ?? error.message);
  });
  const fontIssues: string[] = [];
  page.on('console', async message => {
    if (message.text().includes('Takumi export failed')) {
      fallback.push(message.text());
      for (const arg of message.args()) {
        const cause = await arg
          .evaluate(value =>
            value instanceof Error && value.cause instanceof Error
              ? value.cause.message
              : null,
          )
          .catch(() => null);
        if (cause) console.error('Fallback cause:', cause);
      }
    }
    if (message.text().includes('Export font unavailable'))
      fontIssues.push(message.text());
  });
  page.on('requestfailed', request => {
    const failure = request.failure()?.errorText ?? '';
    if (
      /\.(woff2?|ttf|otf)\b|fonts\.googleapis/.test(request.url()) &&
      !failure.includes('ERR_ABORTED')
    )
      fontIssues.push(`${request.url()} ${failure}`);
  });
  page.on('request', request => {
    if (request.url().includes('.wasm')) wasmRequests.push(request.url());
  });

  let wrapperSelector = '';
  let portalSelector = '';
  let themeSelector = '';
  let themeFooterSelector = '';

  async function boot(page: Page, query = '') {
    await page.route('**/mockServiceWorker.js', route =>
      route.fulfill({
        body: readFileSync(
          path.join(
            root,
            'apps/codeimage/node_modules/msw/lib/mockServiceWorker.js',
          ),
        ),
        contentType: 'text/javascript',
      }),
    );
    await page.route(/\/inter-ui\/Inter(?:%20| )\(web\)\//, route => {
      const name = path.basename(
        decodeURIComponent(new URL(route.request().url()).pathname),
      );
      const fontRoot = path.join(root, 'apps/codeimage/node_modules/inter-ui');
      const file = [
        path.join(fontRoot, 'web', name),
        path.join(fontRoot, 'variable', name),
      ].find(existsSync);
      return file
        ? route.fulfill({body: readFileSync(file), contentType: 'font/woff2'})
        : route.continue();
    });
    await page.addInitScript(() => {
      performance.setResourceTimingBufferSize(10000);
      localStorage.setItem('@store/ui', JSON.stringify({locale: 'en'}));
      localStorage.setItem(
        'codeimage:editor-settings',
        JSON.stringify({layout: 'inspector', themeCards: 'window'}),
      );
    });
    await page.goto(baseUrl + (process.env.P2_PATH ?? '/') + query, {
      waitUntil: 'domcontentloaded',
      timeout: 180000,
    });
    await page
      .locator('.cm-content[contenteditable="true"]')
      .first()
      .waitFor({timeout: 180000});
    await page.keyboard.press('Escape');
    const selectors = await page.evaluate(async () => {
      const framePath = '/src/components/Frame/Frame.css.ts';
      const themePath = '/src/pages/UnifiedEditor/theme-styles/picker.css.ts';
      const [frame, theme] = await Promise.all([
        import(framePath),
        import(themePath),
      ]);
      return {
        wrapper: '.' + CSS.escape(frame.previewWrapper.split(' ')[0]),
        portal: '.' + CSS.escape(frame.previewPortal),
        theme: '[data-theme-option]',
        footer: '.' + CSS.escape(theme.name),
      };
    });
    wrapperSelector = selectors.wrapper;
    portalSelector = selectors.portal;
    themeSelector = selectors.theme;
    themeFooterSelector = selectors.footer;
    console.log({
      selectors,
      contentNodes: await page.locator('.cm-content').count(),
    });
    await page
      .locator(wrapperSelector + ' .cm-content')
      .waitFor({state: 'attached', timeout: 180000});
    await page.keyboard.press('Escape');
    await page.evaluate(async () => {
      await document.fonts.ready;
      await new Promise<void>(resolve =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      );
    });
    await page.waitForTimeout(250);
    const dismiss = page.getByRole('button', {
      name: "Dismiss what's new",
      exact: true,
    });
    if (await dismiss.isVisible()) await dismiss.click();
    await section('themes', page);
    console.log('App ready');
  }

  type Engine = 'dom-export' | 'takumi';
  async function render(
    engine: Engine,
    name: string,
    format: 'png' | 'jpeg' | 'svg' = 'png',
    target: Page = page,
    pixelRatio = 2,
  ) {
    console.log('Rendering', engine, name);
    const result = await target.evaluate(
      async ({engine, format, wrapperSelector, pixelRatio}) => {
        window.setRenderer(engine);
        const modulePath =
          performance
            .getEntriesByType('resource')
            .map(entry => entry.name)
            .filter(name => name.includes('/src/hooks/use-export-image.ts'))
            .at(-1) ?? '/src/hooks/use-export-image.ts';
        const {exportImage} = await import(modulePath);
        const wrapper = document.querySelector(wrapperSelector);
        performance.mark('p2-export-start');
        const blob = await exportImage({
          ref: wrapper,
          renderer: engine,
          rasterizeOptions: {pixelRatio},
          options: {
            mode: 'getBlob',
            extension: format,
            pixelRatio: 2,
            quality: 1,
          },
        });
        performance.mark('p2-export-ready');
        const ms = performance.measure(
          'p2-export',
          'p2-export-start',
          'p2-export-ready',
        ).duration;
        if (!(blob instanceof Blob))
          throw new Error('Export did not produce a blob.');
        const data = new Uint8Array(await blob.arrayBuffer());
        let binary = '';
        for (const byte of data) binary += String.fromCharCode(byte);
        return {b64: btoa(binary), ms, bytes: data.length, type: blob.type};
      },
      {engine, format, wrapperSelector, pixelRatio},
    );
    console.log('Rendered', name, result.ms);
    const bytes = Buffer.from(result.b64, 'base64');
    writeFileSync(path.join(out, name + '.' + format), bytes);
    return {...result, data: bytes};
  }

  async function reference(name: string, pixelRatio = displayDpr) {
    const state = await page.evaluate(
      async ({wrapperSelector, portalSelector}) => {
        const portal = document.querySelector<HTMLElement>(portalSelector);
        if (!portal) throw new Error('Export portal not found.');
        const style = portal.getAttribute('style');
        portal.style.opacity = '1';
        portal.style.zIndex = '99999';
        const hide = document.createElement('style');
        hide.id = 'p2-reference-style';
        hide.textContent = `[data-export-exclude="true"]{visibility:hidden!important}${wrapperSelector}::before,${wrapperSelector}::after,${portalSelector}::before,${portalSelector}::after{display:none!important}`;
        document.head.append(hide);
        return {style, portalSelector};
      },
      {wrapperSelector, portalSelector},
    );
    try {
      const bounds = await page.locator(wrapperSelector + ' > *').boundingBox();
      assert.ok(bounds, 'Export reference has no bounds.');
      const {data} = await screenshotSession.send('Page.captureScreenshot', {
        format: 'png',
        captureBeyondViewport: true,
        clip: {
          ...bounds,
          width: Math.round(bounds.width),
          height: Math.round(bounds.height),
          scale: pixelRatio / displayDpr,
        },
      });
      const png = Buffer.from(data, 'base64');
      writeFileSync(path.join(out, name + '.png'), png);
      return png;
    } finally {
      await page.evaluate(state => {
        const portal = document.querySelector(state.portalSelector);
        if (state.style === null) portal?.removeAttribute('style');
        else portal?.setAttribute('style', state.style);
        document.getElementById('p2-reference-style')?.remove();
      }, state);
    }
  }

  function compare(a: Buffer, b: Buffer, name: string) {
    const left = PNG.sync.read(a);
    const right = PNG.sync.read(b);
    assert.equal(left.width, right.width, `${name} width`);
    assert.equal(left.height, right.height, `${name} height`);
    const diff = new PNG({width: left.width, height: left.height});
    const pixels = pixelmatch(
      left.data,
      right.data,
      diff.data,
      left.width,
      left.height,
      {threshold: 0.1},
    );
    writeFileSync(path.join(out, name + '-diff.png'), PNG.sync.write(diff));
    return {
      percent: (100 * pixels) / (left.width * left.height),
      width: left.width,
      height: left.height,
    };
  }

  async function section(id: string, target: Page = page) {
    const trigger = target.locator(`[data-section="${id}"] > button`);
    if ((await trigger.getAttribute('aria-expanded')) !== 'true')
      await trigger.click();
  }

  async function setTerminal(index: number) {
    await section('window');
    await page.locator('[data-control="window.style"] button').click();
    const labels = ['Windows', 'macOS', 'macOS gray', 'macOS outline'];
    await page.getByRole('radio', {name: labels[index], exact: true}).focus();
    await page.keyboard.press('Space');
    await page.keyboard.press('Escape');
  }

  async function setLineNumbers(show: boolean) {
    await section('editor');
    const control = page
      .locator('[data-control="editor.lineNumbers"]')
      .getByRole('switch');
    if ((await control.isChecked()) !== show) {
      await control.focus();
      await control.press('Space');
    }
    await page.waitForFunction(
      ({show, wrapperSelector}) =>
        !!document.querySelector(wrapperSelector + ' .cm-lineNumbers') === show,
      {show, wrapperSelector},
    );
  }

  async function setCode(code: string, target: Page = page) {
    const editor = target
      .locator('.cm-content[contenteditable="true"]')
      .first();
    await editor.click();
    await target.keyboard.press('ControlOrMeta+A');
    await target.keyboard.insertText(code);
    await target.waitForFunction(
      ({text, wrapperSelector}) =>
        document
          .querySelector(wrapperSelector + ' .cm-content')
          ?.textContent?.includes(text),
      {text: code.split('\n')[0], wrapperSelector},
    );
  }

  async function settings(target: Page, enabled: boolean) {
    await target.locator('[data-settings-trigger]').click();
    await target.locator('[data-settings-section=experiments]').click();
    const control = target.getByRole('switch', {
      name: 'Use Takumi rendering engine',
    });
    await control.waitFor();
    if ((await control.isChecked()) !== enabled) {
      await control.focus();
      await control.press('Space');
    }
    assert.equal(await control.isChecked(), enabled);
    await target.screenshot({path: path.join(out, 'p2-flag.png')});
    await target
      .locator('[data-settings]')
      .getByRole('button', {name: 'Close', exact: true})
      .click();
    await control.waitFor({state: 'hidden'});
  }

  async function downloadUi(target: Page, name: string, ratio = 2) {
    await target.locator('[data-settings-trigger]').click();
    await target.locator('[data-settings-section=export]').click();
    await target
      .locator('[data-setting=export-scale]')
      .getByRole('tab', {name: `${ratio}x`, exact: true})
      .click();
    await target
      .locator('[data-settings]')
      .getByRole('button', {name: 'Close', exact: true})
      .click();
    await target.locator('[data-settings]').waitFor({state: 'hidden'});
    const [download] = await Promise.all([
      target.waitForEvent('download'),
      target.locator('[data-export-image]').click(),
    ]);
    const file = path.join(out, name + '.png');
    await download.saveAs(file);
    assert.equal(await download.failure(), null);
    return readFileSync(file);
  }

  async function runLive() {
    const lanes: {lane: number; passed: boolean; details: unknown}[] = [];
    async function lane(lane: number, action: () => Promise<unknown>) {
      try {
        const details = await action();
        lanes.push({lane, passed: true, details});
      } catch (error) {
        await page
          .screenshot({path: path.join(out, 'lane-' + lane + '-failure.png')})
          .catch(() => undefined);
        lanes.push({lane, passed: false, details: String(error)});
      }
      await page.keyboard.press('Escape');
      console.log(lanes.at(-1));
      writeFileSync(
        path.join(out, 'live.json'),
        JSON.stringify(lanes, null, 2),
      );
    }
    if (process.env.P2_BASELINE) {
      await lane(1, async () => {
        const diff = compare(
          readFileSync(process.env.P2_BASELINE!),
          readFileSync(path.join(out, 'p2-off.png')),
          'trunk-off',
        );
        assert.ok(diff.percent <= 0.5, JSON.stringify(diff));
        return diff;
      });
    }
    if (process.env.P2_MATRIX) {
      await lane(4, async () => {
        const source = process.env.P2_MATRIX!;
        const matrix: {
          rows: {theme: string; terminal: string; takumi: number}[];
        } = JSON.parse(readFileSync(path.join(source, 'parity.json'), 'utf8'));
        const five = matrix.rows
          .filter(row => row.terminal === 'macOs')
          .slice(0, 5);
        assert.equal(five.length, 5);
        assert.ok(five.every(row => row.takumi <= 0.5));
        const images = five.map(row =>
          PNG.sync.read(
            readFileSync(
              path.join(
                source,
                row.theme.replace(/[^a-z0-9]+/gi, '-') + '-macOs-on.png',
              ),
            ),
          ),
        );
        const montage = new PNG({
          width: images.reduce((sum, image) => sum + image.width, 0),
          height: Math.max(...images.map(image => image.height)),
        });
        let left = 0;
        for (const image of images) {
          PNG.bitblt(image, montage, 0, 0, image.width, image.height, left, 0);
          left += image.width;
        }
        writeFileSync(path.join(out, 'p2-themes.png'), PNG.sync.write(montage));
        return five;
      });
    }
    await lane(6, async () => {
      const regions = [
        {x: 314, y: 148, width: 250, height: 80},
        {x: 760, y: 730, width: 250, height: 60},
      ];
      const images = ['p2-chrome.png', 'p2-on.png'].map(file =>
        PNG.sync.read(readFileSync(path.join(out, file))),
      );
      const zoom = new PNG({width: 2000, height: 560});
      for (const [column, image] of images.entries()) {
        let top = 0;
        for (const region of regions) {
          for (let y = 0; y < region.height * 4; y++)
            for (let x = 0; x < region.width * 4; x++) {
              const from =
                ((region.y + Math.floor(y / 4)) * image.width +
                  region.x +
                  Math.floor(x / 4)) *
                4;
              const to = ((top + y) * zoom.width + column * 1000 + x) * 4;
              image.data.copy(zoom.data, to, from, from + 4);
            }
          top += region.height * 4;
        }
      }
      writeFileSync(path.join(out, 'p2-text.png'), PNG.sync.write(zoom));
      return 'Chrome on the left and Takumi on the right, at 400%. Inspect the title and watermark.';
    });
    const originalCode = await page
      .locator('.cm-content[contenteditable="true"]')
      .first()
      .innerText();
    const longCode = Array.from(
      {length: 300},
      (_, i) => `const line${i + 1}: number = ${i + 1};`,
    ).join('\n');
    await lane(2, async () => {
      await settings(page, false);
      const off = await downloadUi(page, 'p2-off-ui');
      await settings(page, true);
      const on = await downloadUi(page, 'p2-on-ui');
      const diff = compare(
        on,
        await reference('p2-on-ui-chrome'),
        'ui-on-chrome',
      );
      assert.ok(diff.percent <= 0.5, JSON.stringify(diff));
      const exact = PNG.sync.read(
        (await render('takumi', 'p2-1x', 'png', page, 1)).data,
      );
      assert.equal(exact.width * 2, diff.width);
      assert.equal(exact.height * 2, diff.height);
      return {
        chrome: diff,
        domExport: compare(on, off, 'ui-on-off'),
        oneX: [exact.width, exact.height],
      };
    });
    await lane(3, async () => {
      await setCode(longCode);
      await page.waitForTimeout(300);
      const off = await render('dom-export', 'p2-long-off');
      const on = await render('takumi', 'p2-long');
      const diff = compare(on.data, off.data, 'long-on-off');
      const referencePng = await reference('p2-long-chrome');
      const chrome = compare(on.data, referencePng, 'long-on-chrome');
      const docLines = await page.evaluate(async () => {
        return document.querySelectorAll('[data-static-code-view] .cm-line')
          .length;
      });
      assert.equal(docLines, 300);
      assert.equal(chrome.width, diff.width);
      assert.equal(chrome.height, diff.height);
      assert.ok(chrome.percent <= 0.5, JSON.stringify(chrome));
      await setLineNumbers(true);
      const numbered = compare(
        (await render('takumi', 'p2-long-numbers')).data,
        await reference('p2-long-numbers-chrome'),
        'long-numbers-on-chrome',
      );
      await setLineNumbers(false);
      assert.ok(numbered.percent <= 0.5, JSON.stringify(numbered));
      return {domExport: diff, chrome, numbered, docLines};
    });
    await lane(5, async () => {
      await setCode(originalCode);
      await page.waitForTimeout(300);
      const png = await render('takumi', 'p2-svg-reference');
      const svg = await render('takumi', 'p2-vector', 'svg');
      assert.equal(svg.data.toString().includes('foreignObject'), false);
      const b64 = await page.evaluate(async svg => {
        const img = new Image();
        img.src = 'data:image/svg+xml;base64,' + svg;
        await img.decode();
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        canvas.getContext('2d')?.drawImage(img, 0, 0);
        return canvas.toDataURL('image/png').split(',')[1];
      }, svg.b64);
      const raster = Buffer.from(b64, 'base64');
      writeFileSync(path.join(out, 'p2-svg.png'), raster);
      const diff = compare(png.data, raster, 'svg-png');
      assert.ok(diff.percent <= 0.5, JSON.stringify(diff));
      return diff;
    });
    await setCode(originalCode);
    await lane(8, async () => {
      await boot(page, '?renderer=takumi');
      await page.reload({waitUntil: 'domcontentloaded'});
      await page
        .locator('.cm-content[contenteditable="true"]')
        .first()
        .waitFor();
      await page.keyboard.press('Escape');
      await settings(page, true);
      await boot(page);
      if (process.env.P2_REVIEW_CASE === 'local-fonts') {
        await runLocalFonts();
        return;
      }
      await page.locator('[data-settings-trigger]').click();
      await page.locator('[data-settings-section=experiments]').click();
      const control = page.getByRole('switch', {
        name: 'Use Takumi rendering engine',
      });
      assert.equal(await control.getAttribute('aria-checked'), 'true');
      await page.keyboard.press('Escape');
      await boot(page, '?renderer=dom-export');
      await page.locator('[data-settings-trigger]').click();
      await page.locator('[data-settings-section=experiments]').click();
      assert.equal(
        await page
          .getByRole('switch', {name: 'Use Takumi rendering engine'})
          .getAttribute('aria-checked'),
        'false',
      );
      await page.screenshot({path: path.join(out, 'p2-flag-off.png')});
      await page.keyboard.press('Escape');
      await settings(page, true);
      return 'Query flags, reload, persistence without query, and explicit off flag passed.';
    });
    await lane(9, async () => {
      await setCode(originalCode);
      await page.locator('[data-export-menu]').click();
      await page
        .getByRole('menuitem', {name: 'Copy to clipboard', exact: true})
        .click();
      const b64 = await page.evaluate(async () => {
        for (let attempt = 0; attempt < 100; attempt++) {
          const items = await navigator.clipboard.read();
          const item = items.find(item => item.types.includes('image/png'));
          if (item) {
            const blob = await item.getType('image/png');
            let data = '';
            for (const byte of new Uint8Array(await blob.arrayBuffer()))
              data += String.fromCharCode(byte);
            return btoa(data);
          }
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        throw new Error('Clipboard PNG was not written.');
      });
      const clipboard = Buffer.from(b64, 'base64');
      writeFileSync(path.join(out, 'p2-clipboard.png'), clipboard);
      const downloaded = await downloadUi(page, 'p2-clipboard-download', 3);
      const diff = compare(clipboard, downloaded, 'clipboard-download');
      assert.equal(diff.percent, 0);
      return diff;
    });
    await lane(10, async () => {
      await section('frame');
      await page.locator('[data-control="frame.background"] button').click();
      await page.getByText('Custom', {exact: true}).click();
      const fixture = new PNG({width: 64, height: 64});
      for (let y = 0; y < 64; y++)
        for (let x = 0; x < 64; x++) {
          const i = (y * 64 + x) * 4;
          fixture.data[i] = x * 4;
          fixture.data[i + 1] = y * 4;
          fixture.data[i + 2] = 180;
          fixture.data[i + 3] = 255;
        }
      await page.locator('input[type="file"]').setInputFiles({
        name: 'p2-background.png',
        mimeType: 'image/png',
        buffer: PNG.sync.write(fixture),
      });
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);
      const off = await render('dom-export', 'p2-bg-off');
      const on = await render('takumi', 'p2-bg');
      const diff = compare(
        on.data,
        await reference('p2-bg-chrome'),
        'background-on-chrome',
      );
      assert.ok(diff.percent <= 0.5, JSON.stringify(diff));
      return {
        chrome: diff,
        domExport: compare(on.data, off.data, 'background-on-off'),
      };
    });
    await lane(7, async () => {
      const isolated = await browser.newContext({
        viewport: {width: 1440, height: 1000},
        deviceScaleFactor: displayDpr,
      });
      try {
        const target = await isolated.newPage();
        const messages: string[] = [];
        target.on('console', m => {
          if (m.text().includes('Takumi export failed'))
            messages.push(m.text());
        });
        await target.addInitScript(() => {
          const original = window.fetch;
          window.fetch = (input, init) => {
            if (
              String(input instanceof Request ? input.url : input).includes(
                '.wasm',
              )
            )
              return Promise.reject(
                new TypeError('P2 verification blocks WASM.'),
              );
            return original(input, init);
          };
        });
        await boot(target, '?renderer=takumi');
        await settings(target, true);
        const data = await downloadUi(target, 'p2-fallback');
        assert.ok(data.length > 1000);
        assert.equal(messages.length, 1);
        await target.screenshot({path: path.join(out, 'p2-fallback-ui.png')});
        return messages;
      } finally {
        await isolated.close();
      }
    });
    assert.ok(
      lanes.every(lane => lane.passed),
      'A live lane failed.',
    );
    if (process.env.P2_PERF === '0') return;
    await section('themes');
    await page
      .locator(themeSelector)
      .filter({has: page.getByText('Fleet Dark', {exact: true})})
      .click();
    await setCode(longCode);
    await render('dom-export', 'warmup-off');
    await render('takumi', 'warmup-on');
    const timing: Record<Engine, number[]> = {'dom-export': [], takumi: []};
    for (let run = 0; run < 10; run++)
      for (const engine of (run % 2
        ? ['takumi', 'dom-export']
        : ['dom-export', 'takumi']) as Engine[]) {
        const result = await render(engine, `perf-${engine}-${run}`);
        assert.ok(result.bytes > 1000);
        timing[engine].push(result.ms);
      }
    const cdp = await context.newCDPSession(page);
    const profiles = [];
    for (const engine of ['dom-export', 'takumi'] as const) {
      await cdp.send('Profiler.enable');
      await cdp.send('Profiler.start');
      await render(engine, 'profile-' + engine);
      const {profile} = await cdp.send('Profiler.stop');
      writeFileSync(
        path.join(out, engine + '.cpuprofile'),
        JSON.stringify(profile),
      );
      profiles.push({
        engine,
        hot: profile.nodes
          .filter(node => node.hitCount)
          .sort((a, b) => (b.hitCount ?? 0) - (a.hitCount ?? 0))
          .slice(0, 8)
          .map(node => ({
            name: node.callFrame.functionName,
            url: node.callFrame.url,
            hits: node.hitCount,
          })),
      });
    }
    const cold = [];
    for (let run = 0; run < 5; run++) {
      const isolated = await browser.newContext({
        viewport: {width: 1440, height: 1000},
        deviceScaleFactor: displayDpr,
      });
      try {
        const target = await isolated.newPage();
        const cdp = await isolated.newCDPSession(target);
        await cdp.send('Network.enable');
        await cdp.send('Network.setCacheDisabled', {cacheDisabled: true});
        let wasm = 0;
        target.on('request', r => {
          if (r.url().includes('.wasm')) wasm++;
        });
        await boot(target, '?renderer=takumi');
        await setCode(longCode, target);
        const result = await render('takumi', 'cold-' + run, 'png', target);
        assert.equal(wasm, 1);
        cold.push(result.ms);
      } finally {
        await isolated.close();
      }
    }
    const stats = (values: number[]) => {
      const sorted = [...values].sort((a, b) => a - b);
      const middle = (values.length - 1) / 2;
      return {
        runs: values.length,
        median: (sorted[Math.floor(middle)] + sorted[Math.ceil(middle)]) / 2,
        min: Math.min(...values),
        max: Math.max(...values),
        values,
      };
    };
    const perf = {
      warm: {
        domExport: stats(timing['dom-export']),
        takumi: stats(timing.takumi),
      },
      cold: stats(cold),
      profiles,
    };
    writeFileSync(path.join(out, 'perf.json'), JSON.stringify(perf, null, 2));
    console.log(JSON.stringify({perf}));
    assert.ok(
      perf.warm.takumi.median <= perf.warm.domExport.median,
      'Warm Takumi median is slower.',
    );
    assert.ok(perf.cold.max <= 2000, 'A cold first export exceeds 2 seconds.');
    assert.ok(
      lanes.every(lane => lane.passed),
      'A live lane failed.',
    );
  }

  async function runReviewCases() {
    await setCode(
      Array.from(
        {length: 300},
        (_, i) => `const line${i + 1}: number = ${i + 1};`,
      ).join('\n'),
    );
    await setLineNumbers(true);
    await page.waitForTimeout(300);
    const geometry = await page.evaluate(async wrapperSelector => {
      const frame = document.querySelector(wrapperSelector + ' > *');
      const code = frame?.querySelector('.cm-line');
      const gutter = frame?.querySelector('.cm-lineNumbers');
      if (!frame || !code || !gutter) throw new Error('Missing numbered code.');
      const bounds = frame.getBoundingClientRect();
      const codeBounds = code.getBoundingClientRect();
      const gutterBounds = gutter.getBoundingClientRect();
      const row = gutter.querySelector('.cm-gutterElement:last-child');
      return {
        displayDpr: devicePixelRatio,
        codeX: codeBounds.x - bounds.x,
        gutterX: gutterBounds.x - bounds.x,
        top: codeBounds.y - bounds.y,
        codeLineHeight: getComputedStyle(code).lineHeight,
        gutterHeight: row?.getBoundingClientRect().height,
      };
    }, wrapperSelector);
    const crossovers = [];
    for (const ratio of [1, 2]) {
      const name = `numbered-display-${displayDpr}-export-${ratio}`;
      const result = await render('takumi', name, 'png', page, ratio);
      const png = PNG.sync.read(result.data);
      function glyphBottoms(kind: 'code' | 'number', bottom = png.height) {
        const x0 = Math.ceil(
          (kind === 'code' ? geometry.codeX + 10 : geometry.gutterX + 5) *
            ratio,
        );
        const x1 = Math.floor(
          (kind === 'code' ? geometry.codeX + 50 : geometry.codeX - 5) * ratio,
        );
        const bottoms: number[] = [];
        let ink = false;
        for (let y = Math.floor(geometry.top * ratio); y < bottom; y++) {
          let count = 0;
          for (let x = x0; x < x1; x++) {
            const i = (y * png.width + x) * 4;
            const [r, g, b] = png.data.subarray(i, i + 3);
            if (
              kind === 'code'
                ? g > 100 && g - r > 20 && b - r > 20
                : r > 60 &&
                  r < 170 &&
                  Math.abs(r - g) < 8 &&
                  Math.abs(g - b) < 8
            )
              count++;
          }
          if (count === 0 && ink) bottoms.push(y - 1);
          ink = count > 0;
        }
        return bottoms;
      }
      const code = glyphBottoms('code');
      const numbers = glyphBottoms('number', code[299] + 8 * ratio);
      assert.equal(code.length, 300, 'Expected 300 code baselines.');
      assert.equal(numbers.length, 300, 'Expected 300 number baselines.');
      const offsets = numbers.map((bottom, i) => bottom - code[i]);
      const drift = offsets[299] - offsets[0];
      const chrome =
        ratio === displayDpr
          ? compare(
              result.data,
              await reference(name + '-chrome'),
              name + '-chrome',
            )
          : null;
      crossovers.push({
        displayDpr,
        ratio,
        drift,
        firstOffset: offsets[0],
        lastOffset: offsets[299],
        minOffset: Math.min(...offsets),
        maxOffset: Math.max(...offsets),
        chrome,
      });
    }
    writeFileSync(
      path.join(out, 'crossovers.json'),
      JSON.stringify({geometry, crossovers}, null, 2),
    );
    console.log('CROSSOVERS', JSON.stringify(crossovers));
    assert.ok(
      crossovers.every(row => Math.abs(row.drift) <= 1),
      'Gutter baselines drift over 300 lines.',
    );
    assert.ok(
      crossovers.every(row => !row.chrome || row.chrome.percent <= 0.5),
      'Numbered export exceeds Chrome parity gate.',
    );
  }

  async function runLocalFonts() {
    const {targetInfo} = await screenshotSession.send('Target.getTargetInfo');
    await screenshotSession.send('Browser.setPermission', {
      browserContextId: targetInfo.browserContextId,
      permission: {name: 'local-fonts'},
      setting: 'granted',
      origin: baseUrl,
    });
    const diagnostic = await page.evaluate(async () => {
      const fonts = await window.queryLocalFonts!();
      const results = [];
      const modulePath = '/node_modules/@takumi-rs/wasm/dist/export.mjs';
      const wasmPath = '/node_modules/@takumi-rs/wasm/bundlers/wasm-url.mjs';
      const {default: init, Renderer} = await import(modulePath);
      const {default: url} = await import(wasmPath);
      await init({module_or_path: url});
      const renderer = new Renderer();
      for (const font of fonts.filter(font =>
        ['Menlo', 'Monaco'].includes(font.family),
      )) {
        let stage = 'blob';
        let bytes = 0;
        let signature: number[] = [];
        try {
          const data = new Uint8Array(await (await font.blob()).arrayBuffer());
          bytes = data.length;
          signature = Array.from(data.slice(0, 4));
          stage = 'registration';
          const families = await renderer.registerFont({
            name: font.family,
            data,
          });
          results.push({
            name: font.fullName,
            families,
            bytes: data.length,
            signature: Array.from(data.slice(0, 4)),
          });
        } catch (error) {
          results.push({
            name: font.fullName,
            bytes,
            signature,
            stage,
            error: String(error),
          });
        }
      }
      renderer.free();
      return {
        permission: (
          await navigator.permissions.query({
            name: 'local-fonts',
          } as PermissionDescriptor)
        ).state,
        count: fonts.length,
        results,
      };
    });
    console.log('NATIVE FONT DIAGNOSTIC', JSON.stringify(diagnostic));
    async function chooseFont(name: string, system = false) {
      await section('font');
      const trigger = page.locator('[class*="FontPicker_inputValue"]').first();
      await trigger.click();
      const tab = page
        .getByRole('tab', {name: system ? 'System' : 'Default', exact: true})
        .last();
      if ((await tab.getAttribute('aria-selected')) !== 'true')
        await tab.click();
      if (system) {
        const search = page.getByPlaceholder('Search font...');
        await search.fill('');
        await search.pressSequentially(name.toLowerCase());
      }
      await page.getByRole('option', {name, exact: true}).click();
      await page.keyboard.press('Escape');
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(300);
    }
    assert.ok(
      diagnostic.count > 0,
      'Native local fonts are not available in this browser context.',
    );
    await page.evaluate(() => {
      window.fontProbeState = {queries: 0, blobs: []};
      const query = window.queryLocalFonts!.bind(window);
      window.queryLocalFonts = options => {
        window.fontProbeState.queries++;
        return query(options);
      };
      const blob = FontData.prototype.blob;
      FontData.prototype.blob = function () {
        window.fontProbeState.blobs.push(this.postscriptName);
        return blob.call(this);
      };
    });
    const fontRequests: string[] = [];
    page.on('request', request => {
      if (/\.(woff2?|ttf|otf)\b/.test(request.url()))
        fontRequests.push(decodeURIComponent(new URL(request.url()).pathname));
    });
    async function exportWithFont(name: string) {
      await page.evaluate(() => {
        window.fontProbeState.queries = 0;
        window.fontProbeState.blobs = [];
      });
      if (process.env.P2_FONT_WEIGHT) {
        await page.evaluate(async weight => {
          const {getRootEditorStore} =
            await import('/src/state/editor/index.ts');
          getRootEditorStore().actions.setFontWeight(weight);
          await document.fonts.ready;
        }, Number(process.env.P2_FONT_WEIGHT));
      }
      fontRequests.length = 0;
      const previousFallbacks = fallback.length;
      const result = await render('takumi', `local-${name}`);
      const chrome = compare(
        result.data,
        await reference(`local-${name}-chrome`),
        `local-${name}`,
      );
      const weights = await page.evaluate(
        selector =>
          [...document.querySelectorAll(selector + ' .cm-content span')].map(
            node => getComputedStyle(node).fontWeight,
          ),
        wrapperSelector,
      );
      if (process.env.P2_FONT_WEIGHT)
        assert.ok(
          weights.includes(process.env.P2_FONT_WEIGHT),
          'Requested bold code weight is not rendered',
        );
      const access = await page.evaluate(() => window.fontProbeState);
      assert.equal(access.queries, 0, 'Export must not enumerate fonts.');
      const row = {
        family: name,
        weights: [...new Set(weights)],
        chrome,
        access,
        requests: [...fontRequests],
        fallback: fallback.slice(previousFallbacks),
      };
      console.log('LOCAL FONT', JSON.stringify(row));
      return {row, result};
    }
    const webFonts = (
      process.env.P2_WEB_FONTS ??
      (process.env.P2_WEB_FONT === 'geist-mono' ? 'Geist Mono' : '')
    )
      .split(',')
      .filter(Boolean);
    const web = [];
    for (const family of webFonts.length ? webFonts : [null]) {
      if (family) await chooseFont(family);
      const webFont = await page
        .locator('[class*="FontPicker_inputValue"]')
        .first()
        .innerText();
      const {row} = await exportWithFont(webFont);
      web.push(row);
      assert.deepEqual(row.fallback, [], `${webFont} fell back.`);
      assert.deepEqual(row.access.blobs, [], `${webFont} read a system font.`);
      assert.ok(row.chrome.percent <= 0.5, `${webFont} exceeds 0.5%.`);
    }
    const system = [];
    for (const family of (process.env.P2_SYSTEM_FONTS ?? 'Menlo')
      .split(',')
      .filter(Boolean)) {
      await chooseFont(family, true);
      const {row, result} = await exportWithFont(family);
      system.push(row);
      assert.ok(
        row.access.blobs.length > 0,
        `${family} export did not read its stored FontData.`,
      );
      if (row.fallback.length) {
        assert.equal(row.fallback.length, 1);
        await page
          .getByText(
            `Used browser export for ${family}. ${row.fallback[0].includes('(format)') ? 'This font format is not supported by Takumi.' : 'The font data could not be read.'}`,
            {exact: true},
          )
          .waitFor();
        const browserExport = await render(
          'dom-export',
          `local-${family}-fallback-reference`,
        );
        assert.equal(
          compare(result.data, browserExport.data, `local-${family}-fallback`)
            .percent,
          0,
        );
      } else {
        assert.ok(
          row.chrome.percent <= 0.5,
          `${family} exceeds the Chrome parity gate.`,
        );
      }
    }
    const report = {diagnostic, web, system, fallback};
    console.log('LOCAL FONT RESULTS', JSON.stringify(report));
    writeFileSync(
      path.join(out, 'local-fonts.json'),
      JSON.stringify(report, null, 2),
    );
  }

  async function runBlockedFont() {
    const originalFetch = await page.evaluateHandle(() => window.fetch);
    await page.evaluate(() => {
      const original = window.fetch;
      window.fetch = (input, init) => {
        if (
          String(input instanceof Request ? input.url : input).includes(
            'fonts.gstatic.com',
          )
        )
          return Promise.reject(
            new TypeError('P2 verification blocks code font download.'),
          );
        return original(input, init);
      };
    });
    const expected = await render('dom-export', 'font-fallback-reference');
    const blocked = await render('takumi', 'font-blocked');
    const diff = compare(
      blocked.data,
      expected.data,
      'font-blocked-dom-export',
    );
    const messages = [...fallback];
    writeFileSync(
      path.join(out, 'blocked-font.json'),
      JSON.stringify({diff, messages}, null, 2),
    );
    assert.equal(
      messages.length,
      1,
      'Missing font must trigger exactly one fallback.',
    );
    assert.ok(
      messages[0].includes('font'),
      'Fallback must explain the missing font.',
    );
    assert.equal(diff.percent, 0, 'Blocked font export must equal dom-export.');
    await page
      .getByText(
        /^Used browser export for Jetbrains Mono\. The font data could not be read\.$/i,
      )
      .waitFor();
    await page.evaluate(original => {
      window.fetch = original;
    }, originalFetch);
    await originalFetch.dispose();
    const recovered = await render('takumi', 'font-recovered');
    const chrome = compare(
      recovered.data,
      await reference('font-recovered-chrome'),
      'font-recovered',
    );
    assert.ok(chrome.percent <= 0.5);
    assert.equal(fallback.length, 1);
    writeFileSync(
      path.join(out, 'blocked-font.json'),
      JSON.stringify({diff, messages, recovered: chrome}, null, 2),
    );
  }

  const rows: {
    theme: string;
    terminal: string;
    takumi: number;
    domExport: number;
    onVsOff: number;
  }[] = [];
  const workerPath = path.join(
    root,
    'apps/codeimage/public/mockServiceWorker.js',
  );
  const originalWorker = readFileSync(workerPath);
  writeFileSync(
    workerPath,
    readFileSync(
      path.join(
        root,
        'apps/codeimage/node_modules/msw/lib/mockServiceWorker.js',
      ),
    ),
  );
  try {
    await boot(page);
    if (process.env.P2_SETUP_ONLY === '1') {
      await setTerminal(0);
      await setLineNumbers(true);
      await setLineNumbers(false);
      await settings(page, false);
      PNG.sync.read(await downloadUi(page, 'setup-export'));
      console.log('Setup passed: unified controls and PNG download');
      return;
    }
    if (process.env.P2_MARKS === '1') {
      await setCode(
        'const before = 1;\nconst after = 2;\nconst highlighted = 3;\nconst unchanged = 4;',
      );
      const results = [];
      for (const theme of ['Fleet Dark', 'GitHub Light']) {
        await section('themes');
        await page
          .locator(themeSelector)
          .filter({has: page.getByText(theme, {exact: true})})
          .click();
        for (const numbers of [false, true]) {
          await setLineNumbers(numbers);
          for (const focus of [false, true]) {
            await page.evaluate(async focus => {
              const {getRootEditorStore} =
                await import('/src/state/editor/index.ts');
              const {setLineMarks} =
                await import('/src/components/CustomEditor/plugins/lineMarks/state.ts');
              const view = getRootEditorStore().activeEditorView();
              if (!view) throw new Error('Missing active editor view.');
              setLineMarks(
                view,
                {
                  lines: [
                    {line: 1, kind: 'removed'},
                    {line: 2, kind: 'added'},
                    {line: 3, kind: 'highlight'},
                  ],
                  focusedLines: focus ? [2, 3] : [],
                },
                false,
              );
            }, focus);
            await page.waitForFunction(
              ({wrapperSelector, focus}) => {
                const node = document.querySelector(
                  wrapperSelector + ' [data-line-marks]',
                );
                return (
                  node?.querySelectorAll('[data-mark]').length === 3 &&
                  (node.getAttribute('data-line-focus') === 'true') === focus
                );
              },
              {wrapperSelector, focus},
            );
            for (let terminal = 0; terminal < 4; terminal++) {
              await setTerminal(terminal);
              const name = `marks-${theme.replace(/ /g, '-')}-${numbers}-${focus}-${terminal}`;
              const image = await render('takumi', name);
              const diff = compare(
                image.data,
                await reference(name + '-chrome'),
                name + '-chrome',
              );
              results.push({theme, numbers, focus, terminal, ...diff});
              assert.ok(diff.percent <= 0.5, JSON.stringify(results.at(-1)));
            }
          }
        }
      }
      assert.deepEqual(errors, []);
      assert.deepEqual(fallback, []);
      assert.deepEqual(fontIssues, []);
      writeFileSync(
        path.join(out, 'marks.json'),
        JSON.stringify({results, errors, fallback, fontIssues}, null, 2),
      );
      return;
    }
    if (process.env.P2_TARGETS === '1') {
      const targets = [
        {id: 'x-landscape', width: 1600, height: 900},
        {id: 'square', width: 1080, height: 1080},
        {id: 'linkedin-portrait', width: 1080, height: 1350},
        {id: 'open-graph', width: 1200, height: 630},
      ];
      const results = [];
      for (const target of targets) {
        await page.evaluate(async id => {
          const {getFrameState} = await import('/src/state/editor/frame.ts');
          const frame = getFrameState();
          frame.setExportTarget(id);
          frame.setSignature({handle: '@codeimage', position: 'bottom-right'});
        }, target.id);
        await page.waitForFunction(
          ({wrapperSelector, width, height}) => {
            const node = document.querySelector(wrapperSelector + ' > *');
            const rect = node?.getBoundingClientRect();
            return (
              rect &&
              Math.round(rect.width) === width &&
              Math.round(rect.height) === height
            );
          },
          {...target, wrapperSelector},
        );
        await page.evaluate(() => document.fonts.ready);
        const chrome = await reference(target.id + '-chrome', 1);
        for (const engine of ['dom-export', 'takumi'] as const) {
          const image = await render(
            engine,
            target.id + '-' + engine,
            'png',
            page,
            3,
          );
          const png = PNG.sync.read(image.data);
          assert.equal(png.width, target.width);
          assert.equal(png.height, target.height);
          const diff = compare(
            image.data,
            chrome,
            target.id + '-' + engine + '-chrome',
          );
          results.push({target: target.id, engine, ...diff});
          console.log(results.at(-1));
          assert.ok(diff.percent <= 0.5, JSON.stringify(results.at(-1)));
        }
      }
      writeFileSync(
        path.join(out, 'targets.json'),
        JSON.stringify(results, null, 2),
      );
      return;
    }
    if (process.env.P2_REVIEW_CASE === 'local-fonts') {
      await runLocalFonts();
      return;
    }
    if (process.env.P2_REVIEW_CASE === 'crossovers') {
      await runReviewCases();
      assert.deepEqual(fallback, []);
      assert.deepEqual(fontIssues, []);
      return;
    }
    if (process.env.P2_REVIEW_CASE === 'blocked-font') {
      await runBlockedFont();
      return;
    }
    await render('dom-export', 'p2-off-first');
    const off = await render('dom-export', 'p2-off');
    assert.equal(wasmRequests.length, 0, 'Flag-off export requested WASM.');
    const on = await render('takumi', 'p2-on');
    const chrome = await reference('p2-chrome');
    const initial = {
      onVsChrome: compare(on.data, chrome, 'default-on-chrome'),
      offVsChrome: compare(off.data, chrome, 'default-off-chrome'),
      onVsOff: compare(on.data, off.data, 'default-on-off'),
    };
    console.log(
      JSON.stringify({initial, fallback, fontIssues, errors, wasmRequests}),
    );
    assert.deepEqual(fallback, [], 'Takumi fell back before the matrix.');
    assert.deepEqual(fontIssues, [], 'An export font did not load.');
    if (!quick) {
      await section('themes');
      const themes = await page
        .locator(themeSelector)
        .locator(themeFooterSelector)
        .allTextContents();
      assert.ok(themes.length > 5, 'Theme matrix is empty.');
      for (const theme of themes) {
        await section('themes');
        await page
          .locator(themeSelector)
          .filter({has: page.getByText(theme.trim(), {exact: true})})
          .click();
        for (const [index, terminal] of [
          'windows',
          'macOs',
          'macOsGrayTheme',
          'macOsOutlineTheme',
        ].entries()) {
          await setTerminal(index);
          await page.evaluate(() => document.fonts.ready);
          await page.waitForTimeout(250);
          const slug = `${theme.trim().replace(/[^a-z0-9]+/gi, '-')}-${terminal}`;
          const off = await render('dom-export', `${slug}-off`);
          const on = await render('takumi', `${slug}-on`);
          const chrome = await reference(`${slug}-chrome`);
          rows.push({
            theme: theme.trim(),
            terminal,
            takumi: compare(on.data, chrome, `${slug}-on-chrome`).percent,
            domExport: compare(off.data, chrome, `${slug}-off-chrome`).percent,
            onVsOff: compare(on.data, off.data, `${slug}-on-off`).percent,
          });
          console.log(JSON.stringify(rows.at(-1)));
        }
      }
    }
    writeFileSync(
      path.join(out, 'parity.json'),
      JSON.stringify(
        {initial, rows, errors, fallback, fontIssues, wasmRequests},
        null,
        2,
      ),
    );
    console.table(rows);
    if (process.env.P2_LIVE === '1') await runLive();
    assert.equal(fallback.length, 0, 'Takumi fell back during parity.');
    assert.deepEqual(fontIssues, [], 'An export font did not load.');
    assert.ok(
      initial.onVsChrome.percent <= 0.5,
      'Default Takumi exceeds 0.5% from Chrome.',
    );
    assert.ok(
      rows.every(row => row.takumi <= 0.5),
      'A Takumi matrix cell exceeds 0.5%.',
    );
  } finally {
    writeFileSync(workerPath, originalWorker);
    writeFileSync(
      path.join(out, 'diagnostics.json'),
      JSON.stringify({errors, fallback, fontIssues, wasmRequests}, null, 2),
    );
    await page
      .screenshot({path: path.join(out, 'p2-final-ui.png')})
      .catch(() => undefined);
    await context.close();
    await browser.close();
  }
}

void main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
