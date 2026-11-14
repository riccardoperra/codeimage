import assert from 'node:assert/strict';
import {existsSync, mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import {homedir} from 'node:os';
import path from 'node:path';
import pixelmatch from 'pixelmatch';
import {chromium, type Page} from 'playwright';
import {PNG} from 'pngjs';

async function main() {
  const root = path.resolve(__dirname, '../..');
  const out = process.env.P2_OUT ?? '/tmp/swarm-p2';
  const baseUrl = process.env.P2_URL ?? 'http://localhost:4402';
  const quick = process.env.P2_QUICK === '1';
  const executablePath =
    process.env.CHROMIUM_PATH ??
    path.join(
      homedir(),
      'Library/Caches/ms-playwright/chromium-1200/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing',
    );
  mkdirSync(out, {recursive: true});
  const browser = await chromium.launch({executablePath});
  const context = await browser.newContext({
    viewport: {width: 1440, height: 1000},
    deviceScaleFactor: 2,
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
  page.on('console', message => {
    if (message.text().includes('Takumi export failed'))
      fallback.push(message.text());
  });
  page.on('request', request => {
    if (request.url().includes('.wasm')) wasmRequests.push(request.url());
  });

  let wrapperSelector = '';
  let portalSelector = '';
  let themeSelector = '';
  let themeFooterSelector = '';
  let terminalSelector = '';
  let radioSelector = '';
  let popoverSelector = '';

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
    await page.addInitScript(() =>
      performance.setResourceTimingBufferSize(10000),
    );
    await page.goto(baseUrl + '/' + query, {
      waitUntil: 'domcontentloaded',
      timeout: 180000,
    });
    await page
      .getByRole('button', {name: 'Menu', exact: true, includeHidden: true})
      .waitFor({timeout: 180000});
    await page.keyboard.press('Escape');
    const selectors = await page.evaluate(async root => {
      const framePath = '/src/components/Frame/Frame.css.ts';
      const themePath = '/src/components/ThemeSwitcher/ThemeSwitcher.css.ts';
      const terminalPath =
        '/src/components/PropertyEditor/controls/TerminalControlField/TerminalControlField.css.ts';
      const radioPath =
        '/@fs' +
        root +
        '/packages/ui/dist/esm/lib/primitives/RadioBlock/RadioBlock.css.vanilla.js';
      const popoverPath =
        '/src/components/PropertyEditor/SidebarPopover/SidebarPopover.css.ts';
      const [frame, theme, terminal, radio, popover] = await Promise.all([
        import(framePath),
        import(themePath),
        import(terminalPath),
        import(radioPath),
        import(popoverPath),
      ]);
      return {
        wrapper: '.' + CSS.escape(frame.previewWrapper.split(' ')[0]),
        portal: '.' + CSS.escape(frame.previewPortal),
        theme: '.' + CSS.escape(theme.themeBox),
        footer: '.' + CSS.escape(theme.themeBoxFooter.split(' ')[0]),
        terminal: '.' + CSS.escape(terminal.input.split(' ')[0]),
        radio: '.' + CSS.escape(radio.radioBlock({}).split(' ')[0]),
        popover: '.' + CSS.escape(popover.sidebarPopover.split(' ')[0]),
      };
    }, root);
    wrapperSelector = selectors.wrapper;
    portalSelector = selectors.portal;
    themeSelector = selectors.theme;
    themeFooterSelector = selectors.footer;
    terminalSelector = selectors.terminal;
    radioSelector = selectors.radio;
    popoverSelector = selectors.popover;
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
            .filter(name => name.includes('/src/hooks/export-snippet.ts'))
            .at(-1) ?? '/src/hooks/export-snippet.ts';
        const {exportSnippet} = await import(modulePath);
        const wrapper = document.querySelector(wrapperSelector);
        performance.mark('p2-export-start');
        const blob = await exportSnippet({
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

  async function reference(name: string) {
    const state = await page.evaluate(
      async ({wrapperSelector, portalSelector}) => {
        const modulePath =
          performance
            .getEntriesByType('resource')
            .map(entry => entry.name)
            .filter(name => name.includes('/src/hooks/export-snippet.ts'))
            .at(-1) ?? '/src/hooks/export-snippet.ts';
        const {previewEditorView} = await import(modulePath);
        const view = previewEditorView;
        const previous = view.viewState?.printing;
        if (view.viewState && view.measure) {
          view.viewState.printing = true;
          view.measure();
        }
        const portal = document.querySelector<HTMLElement>(portalSelector);
        if (!portal) throw new Error('Export portal not found.');
        const style = portal.getAttribute('style');
        portal.style.opacity = '1';
        portal.style.zIndex = '99999';
        const hide = document.createElement('style');
        hide.id = 'p2-reference-style';
        hide.textContent = `[data-export-exclude="true"]{visibility:hidden!important}${wrapperSelector}::before,${wrapperSelector}::after,${portalSelector}::before,${portalSelector}::after{display:none!important}`;
        document.head.append(hide);
        return {style, previous, portalSelector};
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
          scale: 2,
        },
      });
      const png = Buffer.from(data, 'base64');
      writeFileSync(path.join(out, name + '.png'), png);
      return png;
    } finally {
      await page.evaluate(async state => {
        const portal = document.querySelector(state.portalSelector);
        if (state.style === null) portal?.removeAttribute('style');
        else portal?.setAttribute('style', state.style);
        document.getElementById('p2-reference-style')?.remove();
        const modulePath =
          performance
            .getEntriesByType('resource')
            .map(entry => entry.name)
            .filter(name => name.includes('/src/hooks/export-snippet.ts'))
            .at(-1) ?? '/src/hooks/export-snippet.ts';
        const {previewEditorView: view} = await import(modulePath);
        if (view.viewState) view.viewState.printing = state.previous;
        view.requestMeasure();
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

  async function setTerminal(index: number) {
    await page.locator(terminalSelector).click();
    const title = page.getByText('Window style', {exact: true});
    await title.waitFor();
    const panel = page.locator(popoverSelector).filter({has: title});
    await panel.locator(radioSelector).nth(index).click();
    await page.keyboard.press('Escape');
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
    await target.getByRole('button', {name: 'Menu', exact: true}).click();
    await target.getByRole('menuitem', {name: 'Settings', exact: true}).click();
    const control = target.getByRole('switch', {
      name: 'Use Takumi rendering engine',
    });
    await control.waitFor();
    const dialog = control.locator('xpath=ancestor::*[@role="alertdialog"][1]');
    if ((await control.getAttribute('aria-checked')) !== String(enabled))
      await control.click();
    assert.equal(await control.getAttribute('aria-checked'), String(enabled));
    await dialog.screenshot({path: path.join(out, 'p2-flag.png')});
    await dialog
      .getByRole('button', {name: 'Close', exact: true})
      .last()
      .click();
    await dialog.waitFor({state: 'hidden'});
  }

  async function downloadUi(target: Page, name: string, ratio = 2) {
    await target.getByRole('button', {name: 'Export', exact: true}).click();
    const dialog = target.getByRole('alertdialog').last();
    const slider = dialog.getByRole('slider');
    await slider.focus();
    await slider.press('Home');
    for (let i = 1; i < ratio; i++) await slider.press('ArrowRight');
    const downloading = target.waitForEvent('download');
    await dialog.getByRole('button', {name: 'Confirm', exact: true}).click();
    const download = await downloading;
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
        const modulePath = performance
          .getEntriesByType('resource')
          .map(e => e.name)
          .filter(name => name.includes('/src/hooks/export-snippet.ts'))
          .at(-1);
        const {previewEditorView} = await import(modulePath);
        return previewEditorView.state.doc.lines;
      });
      assert.equal(docLines, 300);
      assert.equal(chrome.width, diff.width);
      assert.equal(chrome.height, diff.height);
      return {domExport: diff, chromeInformational: chrome, docLines};
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
        .getByRole('button', {name: 'Menu', exact: true, includeHidden: true})
        .waitFor();
      await page.keyboard.press('Escape');
      await settings(page, true);
      await boot(page);
      await page.getByRole('button', {name: 'Menu', exact: true}).click();
      await page.getByRole('menuitem', {name: 'Settings', exact: true}).click();
      const control = page.getByRole('switch', {
        name: 'Use Takumi rendering engine',
      });
      assert.equal(await control.getAttribute('aria-checked'), 'true');
      await page.keyboard.press('Escape');
      await boot(page, '?renderer=dom-export');
      await page.getByRole('button', {name: 'Menu', exact: true}).click();
      await page.getByRole('menuitem', {name: 'Settings', exact: true}).click();
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
      await page
        .getByRole('button', {name: 'Copy to clipboard', exact: true})
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
      const colorSelector = await page.evaluate(async () => {
        const modulePath =
          '/src/components/PropertyEditor/controls/ColorPicker/CustomColorPicker.css.ts';
        const styles = await import(modulePath);
        return '.' + CSS.escape(styles.input.split(' ')[0]);
      });
      await page.locator(colorSelector).first().click();
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
        deviceScaleFactor: 2,
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
    await page
      .locator(themeSelector + '[data-selected]')
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
        deviceScaleFactor: 2,
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
    console.log(JSON.stringify({initial, fallback, errors, wasmRequests}));
    if (!quick) {
      const themes = await page
        .locator(themeSelector + '[data-selected]')
        .locator(themeFooterSelector)
        .allTextContents();
      assert.ok(themes.length > 5, 'Theme matrix is empty.');
      for (const theme of themes) {
        await page
          .locator(themeSelector + '[data-selected]')
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
      JSON.stringify({initial, rows, errors, fallback, wasmRequests}, null, 2),
    );
    console.table(rows);
    if (process.env.P2_LIVE === '1') await runLive();
    assert.equal(fallback.length, 0, 'Takumi fell back during parity.');
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
      JSON.stringify({errors, fallback, wasmRequests}, null, 2),
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
