import assert from 'node:assert/strict';
import {animationGifCases} from './animation-gif.mjs';
import {animationStepSizeCases} from './animation-step-size.mjs';
import {execFileSync} from 'node:child_process';
import {readFile, writeFile} from 'node:fs/promises';
import {createMockContext} from './mock-context.mjs';
import {webkit} from 'playwright';
import {resolve} from 'node:path';
import {PNG} from 'pngjs';
import pixelmatch from 'pixelmatch';

export function animationMp4Cases({
  page,
  context,
  out,
  base,
  doctor: checkEditor,
  editor,
  shot,
  section,
}) {
  const originalPage = page;
  const originalContext = context;
  const doctor = (route = '/', expected = 'editor', layout = 'inspector') =>
    checkEditor(route, expected, layout, page);
  editor = () => page.locator('.cm-content[contenteditable="true"]').first();
  shot = name =>
    page.screenshot({path: resolve(out, `${name}.png`), fullPage: true});
  section = async name => {
    const control = page.locator(`[data-section="${name}"] > button`);
    if ((await control.getAttribute('aria-expanded')) !== 'true')
      await control.click();
  };
  const isolated = (name, run) => async () => {
    context = await createMockContext(originalContext.browser(), base, {
      viewport: {width: 1440, height: 1000},
      locale: 'en-US',
    });
    await context.tracing.start({
      screenshots: true,
      snapshots: true,
      sources: false,
    });
    page = await context.newPage();
    page.setDefaultTimeout(12000);
    const errors = [];
    page.on('pageerror', error => errors.push(String(error)));
    try {
      const result = await run();
      assert.deepEqual(errors, [], 'No uncaught errors in the video journey');
      return result;
    } catch (error) {
      await shot(`${name}-fixture-failure`).catch(() => {});
      await writeFile(
        resolve(out, `${name}-fixture-failure.aria.txt`),
        await page
          .locator('body')
          .ariaSnapshot()
          .catch(() => ''),
      );
      throw error;
    } finally {
      try {
        await context.tracing.stop({path: resolve(out, `${name}.trace.zip`)});
      } finally {
        await context.close();
        context = originalContext;
        page = originalPage;
      }
    }
  };
  const dialog = () => page.locator('[data-animation-export]');
  const close = () =>
    dialog().getByRole('button', {name: 'Close', exact: true}).click();
  async function choose(label, value) {
    await dialog()
      .getByRole('button', {name: new RegExp(label)})
      .click();
    await page.getByRole('option', {name: value, exact: true}).click();
    await page.waitForFunction(
      ({label, value}) =>
        [...document.querySelectorAll('[data-animation-export] button')].some(
          button =>
            button.getAttribute('aria-label') === label &&
            button.textContent.includes(value),
        ),
      {label, value},
    );
    await ready();
  }
  async function ready() {
    await page.waitForFunction(
      () =>
        !!document.querySelector('[data-animation-export] [role="alert"]') ||
        [...document.querySelectorAll('[data-animation-export] button')].some(
          button =>
            /^Export (MP4|GIF)$/.test(button.textContent) && !button.disabled,
        ),
      undefined,
      {timeout: 60000},
    );
    assert.equal(
      await dialog().getByRole('alert').count(),
      0,
      await dialog().innerText(),
    );
  }
  async function open() {
    await page.locator('[data-export-menu]').click();
    const item = page.locator('[data-export-action="animation"]');
    if (await item.isVisible()) await item.click();
  }
  async function setup(lines = 3, codes, activate = true) {
    await doctor('/', 'editor', 'inspector');
    await page.waitForTimeout(800);
    const welcome = page.getByRole('button', {name: /^close$/i});
    if (await welcome.isVisible()) await welcome.click();
    await page
      .locator('[data-whats-new="showcase"]')
      .waitFor({state: 'hidden'});
    await section('window');
    await page
      .locator('[data-control="window.style"]')
      .getByRole('button')
      .click();
    await page.getByRole('radio', {name: 'Editor', exact: true}).focus();
    await page.keyboard.press('Space');
    await page
      .getByRole('dialog', {name: 'Window', exact: true})
      .getByRole('button', {name: 'Close', exact: true})
      .click();
    const strip = page
      .locator('[data-window-tabs]')
      .filter({has: page.getByRole('button', {name: 'Add tab', exact: true})})
      .first();
    for (let step = 1; step <= (codes?.length ?? 3); step++) {
      if (step > 1)
        await strip.getByRole('button', {name: 'Add tab', exact: true}).click();
      const code =
        codes?.[step - 1] ??
        Array.from(
          {length: lines},
          (_, i) =>
            `const item${i} = transform(${step + i}, item${Math.max(0, i - 1)});`,
        ).join('\n');
      await editor().fill(code);
      await page.waitForFunction(
        code =>
          [
            ...document.querySelectorAll(
              '.cm-content[contenteditable="true"] .cm-line',
            ),
          ]
            .map(line => line.textContent)
            .join('\n') === code,
        code,
      );
    }
    if (activate) {
      await page.locator('[data-animate-toggle]').click();
      await page.locator('[data-animate-panel]').waitFor();
    }
    await page.evaluate(() => {
      window.__mp4Jobs = [];
      window.__mp4Tasks = [];
      window.__mp4Observer?.disconnect();
      window.__mp4Observer = new PerformanceObserver(list => {
        window.__mp4Tasks.push(
          ...list
            .getEntries()
            .map(e => ({start: e.startTime, duration: e.duration})),
        );
      });
      window.__mp4Observer.observe({type: 'longtask'});
      const send = Worker.prototype.postMessage;
      window.__restoreMp4 = () => {
        Worker.prototype.postMessage = send;
        window.__mp4Observer.disconnect();
      };
      Worker.prototype.postMessage = function (message, ...options) {
        if (message?.kind === 'export') {
          window.__mp4LastJob = message.job;
          const {config, scenes} = message.job;
          window.__mp4Jobs.push({
            config,
            scenes: scenes.map(scene => ({
              durationMs: scene.durationMs,
              slots: [
                ...new DOMParser()
                  .parseFromString(scene.html, 'text/html')
                  .querySelectorAll('[data-watermark-home]'),
              ].map(e => e.dataset.watermarkPlacement),
            })),
            posted: performance.now(),
          });
        }
        return send.call(this, message, ...options);
      };
    });
  }
  async function exportFile(name) {
    const began = await page.evaluate(() => performance.now());
    const downloading = page.waitForEvent('download', {timeout: 180000});
    downloading.catch(() => {});
    await dialog()
      .getByRole('button', {name: 'Export MP4', exact: true})
      .click();
    await dialog().getByRole('progressbar').waitFor({timeout: 60000});
    await shot(`${name}-progress`);
    const file = resolve(out, `${name}.mp4`);
    await (await downloading).saveAs(file);
    const job = await page.evaluate(() => window.__mp4Jobs.at(-1));
    const info = JSON.parse(
      execFileSync(
        'ffprobe',
        [
          '-v',
          'error',
          '-count_frames',
          '-show_streams',
          '-show_format',
          '-of',
          'json',
          file,
        ],
        {encoding: 'utf8'},
      ),
    );
    const stream = info.streams[0];
    const slots = job.scenes.map(scene => scene.slots);
    assert.ok(
      slots[0]?.length,
      'captured scenes contain their watermark placement',
    );
    assert.deepEqual(
      slots,
      slots.map(() => slots[0]),
      'equal-sized steps retain watermark placement through transitions',
    );
    const expectedFrames = Math.ceil(
      (job.scenes.reduce((n, s) => n + s.durationMs, 0) * job.config.fps) /
        1000,
    );
    assert.equal(stream.codec_name, 'h264');
    assert.equal(stream.profile, 'High');
    assert.equal(stream.pix_fmt, 'yuv420p');
    assert.equal(stream.color_range, 'tv');
    for (const key of ['color_space', 'color_transfer', 'color_primaries'])
      assert.equal(stream[key], 'bt709');
    assert.equal(stream.width, job.config.width);
    assert.equal(stream.height, job.config.height);
    assert.equal(stream.r_frame_rate, `${job.config.fps}/1`);
    assert.equal(Number(stream.nb_read_frames), expectedFrames);
    assert.ok(
      Math.abs(Number(stream.duration) - expectedFrames / job.config.fps) <
        0.001,
    );
    const bytes = await readFile(file);
    const boxes = [];
    for (let offset = 0; offset + 8 <= bytes.length;) {
      const size = bytes.readUInt32BE(offset);
      const large = size === 1;
      boxes.push(bytes.toString('ascii', offset + 4, offset + 8));
      offset += large
        ? Number(bytes.readBigUInt64BE(offset + 8))
        : size || bytes.length;
    }
    assert.ok(boxes.indexOf('moov') < boxes.indexOf('mdat'));
    assert.match(await dialog().innerText(), /Ready/);
    const corner = [
      ...execFileSync('ffmpeg', [
        '-v',
        'error',
        '-i',
        file,
        '-frames:v',
        '1',
        '-vf',
        'crop=2:2:0:0',
        '-pix_fmt',
        'rgb24',
        '-f',
        'rawvideo',
        'pipe:1',
      ]),
    ].slice(0, 3);
    const timing = await page.evaluate(
      began => ({
        preparationMs: window.__mp4Jobs.at(-1).posted - began,
        tasks: window.__mp4Tasks.filter(t => t.start >= began),
      }),
      began,
    );
    await shot(name);
    return {name, stream, expectedFrames, boxes, corner, timing};
  }
  async function crossWebkit() {
    const job = await page.evaluate(() => ({
      ...window.__mp4LastJob,
      scenes: [{...window.__mp4LastJob.scenes[0], durationMs: 100}],
      resources: {
        ...window.__mp4LastJob.resources,
        fonts: window.__mp4LastJob.resources.fonts.map(font => ({
          ...font,
          data: Array.from(font.data),
        })),
      },
    }));
    let browser;
    try {
      browser = await webkit.launch({
        executablePath: process.env.VERIFY_WEBKIT_EXECUTABLE,
        timeout: 15000,
      });
      const cross = await browser.newContext();
      const tab = await cross.newPage();
      await tab.route(`${base}/__video_cross`, route =>
        route.fulfill({
          contentType: 'text/html',
          body: '<!doctype html><title>MP4 worker</title>',
        }),
      );
      await tab.goto(`${base}/__video_cross`, {
        waitUntil: 'domcontentloaded',
        timeout: 15000,
      });
      const bytes = await tab.evaluate(
        job =>
          new Promise((resolve, reject) => {
            const worker = new Worker(
              '/src/workers/animation.worker.ts?worker_file&type=module',
              {type: 'module'},
            );
            const timeout = setTimeout(() => {
              worker.terminate();
              reject(new Error('WebKit export timeout'));
            }, 30000);
            const finish = () => {
              clearTimeout(timeout);
              worker.terminate();
            };
            worker.onerror = event => {
              finish();
              reject(new Error(event.message || 'WebKit worker load failure'));
            };
            worker.onmessage = ({data}) => {
              if (data.kind === 'failed') {
                finish();
                reject(new Error(data.cause));
              }
              if (data.kind === 'done') {
                finish();
                resolve(Array.from(new Uint8Array(data.buffer)));
              }
            };
            job.resources.fonts.forEach(
              font => (font.data = new Uint8Array(font.data)),
            );
            worker.postMessage({kind: 'export', job});
          }),
        job,
      );
      const file = resolve(out, 'animation-webkit.mp4');
      await writeFile(file, new Uint8Array(bytes));
      const info = JSON.parse(
        execFileSync(
          'ffprobe',
          [
            '-v',
            'error',
            '-count_frames',
            '-show_streams',
            '-of',
            'json',
            file,
          ],
          {encoding: 'utf8'},
        ),
      );
      await writeFile(
        resolve(out, 'webkit.json'),
        JSON.stringify(
          {browser: browser.version(), stream: info.streams[0]},
          null,
          2,
        ),
      );
    } catch (error) {
      await writeFile(
        resolve(out, 'webkit.json'),
        JSON.stringify(
          {status: 'best-effort failure', error: String(error)},
          null,
          2,
        ),
      );
    } finally {
      await browser?.close();
    }
  }
  async function layouts() {
    await setup(22);
    const results = [];
    try {
      for (const layout of ['inspector', 'dock', 'studio']) {
        if (layout !== 'inspector') {
          await doctor('/', 'editor', layout);
          // Instrumentation is document-local after reload.
          await page.evaluate(() => {
            window.__mp4Jobs = [];
            window.__mp4Tasks = [];
            new PerformanceObserver(list =>
              window.__mp4Tasks.push(
                ...list
                  .getEntries()
                  .map(e => ({start: e.startTime, duration: e.duration})),
              ),
            ).observe({type: 'longtask'});
            const send = Worker.prototype.postMessage;
            Worker.prototype.postMessage = function (message, ...options) {
              if (message?.kind === 'export') {
                window.__mp4LastJob = message.job;
                window.__mp4Jobs.push({
                  config: message.job.config,
                  scenes: message.job.scenes.map(s => ({
                    durationMs: s.durationMs,
                    slots: [
                      ...new DOMParser()
                        .parseFromString(s.html, 'text/html')
                        .querySelectorAll('[data-watermark-home]'),
                    ].map(e => e.dataset.watermarkPlacement),
                  })),
                  posted: performance.now(),
                });
              }
              return send.call(this, message, ...options);
            };
          });
        }
        await open();
        await ready();
        assert.match(
          await dialog().getByRole('button', {name: /Scale/}).innerText(),
          /2×/,
        );
        results.push(await exportFile(`animation-${layout}`));
        await close();
      }
      await open();
      await ready();
      await choose('Output size', '1,920 × 1,080');
      await choose('Frame rate', '60 fps');
      const fullHd = await exportFile('animation-1080p60');
      assert.equal(fullHd.stream.width, 1920);
      assert.equal(fullHd.stream.height, 1080);
      assert.equal(fullHd.stream.r_frame_rate, '60/1');
      results.push(fullHd);
      await close();
      if (process.env.VERIFY_WEBKIT === '1') await crossWebkit();
      await open();
      await ready();
      let downloads = 0;
      const downloaded = () => downloads++;
      page.on('download', downloaded);
      try {
        await dialog()
          .getByRole('button', {name: 'Export MP4', exact: true})
          .click();
        await page.waitForFunction(
          () =>
            Number(
              document
                .querySelector('[data-animation-export] [role="progressbar"]')
                ?.getAttribute('aria-valuemax'),
            ) > 1,
          undefined,
          {timeout: 60000},
        );
        await editor().click();
        await page.keyboard.type('// typing during video export');
        assert.match(await editor().innerText(), /typing during video export/);
        await dialog()
          .getByRole('button', {name: 'Cancel', exact: true})
          .click();
        await dialog().waitFor({state: 'hidden'});
        await page.waitForTimeout(500);
        assert.equal(downloads, 0, 'cancel prevents the MP4 download');
        results.push({name: 'cancel-during-encode', status: 'passed'});
      } finally {
        page.off('download', downloaded);
      }
      return results;
    } finally {
      await page.evaluate(() => window.__restoreMp4?.());
    }
  }
  async function errors() {
    await setup();
    const workerUrl = /\/src\/workers\/animation\.worker\.ts\?/;
    const abort = route => route.abort('failed');
    try {
      await context.route(workerUrl, abort);
      await open();
      await dialog().getByRole('alert').waitFor({timeout: 60000});
      assert.match(
        await dialog().getByRole('alert').innerText(),
        /worker could not load.*update.*offline/i,
      );
      await shot('animation-worker-load-failure');
      await context.unroute(workerUrl, abort);
      await dialog().getByRole('button', {name: 'Retry', exact: true}).click();
      await ready();
      const result = await exportFile('animation-worker-retry');
      await close();
      await page.evaluate(() => {
        const send = Worker.prototype.postMessage;
        window.__restoreWorker = () => {
          Worker.prototype.postMessage = send;
        };
        Worker.prototype.postMessage = function (message, ...options) {
          const result = send.call(this, message, ...options);
          if (message?.kind === 'warm')
            this.dispatchEvent(new MessageEvent('messageerror'));
          return result;
        };
      });
      await open();
      await dialog().getByRole('alert').waitFor();
      assert.match(
        await dialog().getByRole('alert').innerText(),
        /unreadable message/i,
      );
      await page.evaluate(() => window.__restoreWorker());
      await close();
      const wasmUrl = /takumi_wasm_bg\.wasm(?:\?|$)/;
      await context.route(wasmUrl, abort);
      await open();
      await ready();
      await dialog()
        .getByRole('button', {name: 'Export MP4', exact: true})
        .click();
      await dialog().getByRole('alert').waitFor({timeout: 60000});
      assert.match(
        await dialog().getByRole('alert').innerText(),
        /renderer \(WASM\)/,
      );
      await shot('animation-wasm-failure');
      await context.unroute(wasmUrl, abort);
      await close();
      await editor().fill('const afterWorkerFailure = true;');
      return result;
    } finally {
      await context.unroute(workerUrl, abort);
      await page.evaluate(() => window.__restoreMp4?.());
    }
  }
  async function compositing() {
    await setup();
    try {
      await section('frame');
      await page
        .locator('[data-control="frame.radius"]')
        .getByRole('tab', {name: '24', exact: true})
        .click();
      await open();
      await ready();
      const doubled = await exportFile('animation-visible-2x');
      assert.ok(
        Math.max(...doubled.corner) > 40,
        'visible rounded corner uses the frame background',
      );
      await close();
      await open();
      await ready();
      await choose('Scale', '1×');
      const single = await exportFile('animation-visible-1x');
      assert.ok(Math.abs(doubled.stream.width - single.stream.width * 2) <= 2);
      assert.ok(
        Math.abs(doubled.stream.height - single.stream.height * 2) <= 2,
      );
      await close();
      await page.getByRole('switch', {name: 'Visible', exact: true}).focus();
      await page.keyboard.press('Space');
      await open();
      await ready();
      const color = dialog().getByRole('textbox', {
        name: 'Solid background',
        exact: true,
      });
      await color.fill('not-a-colour');
      assert.equal(
        await dialog()
          .getByRole('button', {name: 'Export MP4', exact: true})
          .isDisabled(),
        true,
      );
      await color.fill('#f0a020');
      const hidden = await exportFile('animation-hidden-solid');
      hidden.corner.forEach((value, index) =>
        assert.ok(
          Math.abs(value - [240, 160, 32][index]) <= 18,
          `solid corner ${hidden.corner}`,
        ),
      );
      await close();
      return [doubled, single, hidden];
    } finally {
      await page.evaluate(() => window.__restoreMp4?.());
    }
  }
  async function modes() {
    await setup(3, undefined, false);
    assert.equal(await page.locator('[data-export-video]').count(), 0);
    await page.locator('[data-export-menu]').click();
    assert.ok(
      (await page.getByRole('radio', {name: /PNG/}).count()) ||
        (await page.getByRole('tab', {name: /PNG/}).count()),
    );
    await page.keyboard.press('Escape');
    await page.locator('[data-animate-toggle]').click();
    await page.getByRole('button', {name: 'Export video', exact: true}).click();
    await ready();
    assert.equal(
      await dialog().getByRole('radio', {name: 'MP4', exact: true}).count(),
      1,
    );
    assert.equal(await dialog().getByRole('radio', {name: /PNG/}).count(), 0);
    await close();
    await page.locator('[data-export-menu]').click();
    await ready();
    await dialog()
      .getByRole('button', {name: 'Export as image', exact: true})
      .click();
    await page.locator('[data-export-image]').waitFor();
    assert.equal(await page.locator('[data-animate-panel]').count(), 0);
    await page.keyboard.press('Escape');
    await editor().fill('const api_key = "active-r4nd0m-K7v9Qp2X";');
    await page.locator('[data-animate-toggle]').click();
    await page.getByRole('button', {name: 'Export video', exact: true}).click();
    const review = page.getByRole('alertdialog', {
      name: 'Export animation',
      exact: true,
    });
    await review.waitFor();
    await shot('animation-secrets-review');
    await review.getByRole('button', {name: 'Redact all', exact: true}).click();
    await review.getByRole('button', {name: 'Confirm', exact: true}).click();
    await ready();
    assert.doesNotMatch(await editor().innerText(), /K7v9Qp2X/);
    await close();
  }
  async function parity() {
    const first =
      'function Counter() {\n  const [count, setCount] = createSignal(0);\n\n  setInterval(\n    () => setCount(count() + 1),\n    1000\n  );\n\n  return <div>The count is {count()}</div>\n}';
    const codes = [
      first,
      first.replace('Counter()', 'Counter(params: string)'),
    ];
    await setup(10, codes, false);
    await page.locator('[data-settings-trigger]').click();
    await page.locator('[data-settings-section="export"]').click();
    await page
      .locator('[data-setting="export-scale"]')
      .getByRole('tab', {name: '2x', exact: true})
      .click();
    await page.getByRole('button', {name: 'Close', exact: true}).click();
    await page.getByRole('alertdialog').waitFor({state: 'hidden'});
    const results = [];
    let naturalClip;
    for (const size of ['current', 'widened']) {
      if (size === 'widened') {
        const handle = page.locator('[class*="dragControlRight"]').first();
        const box = await handle.boundingBox();
        assert.ok(box, 'real frame resize handle');
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
        await page.mouse.down();
        await page.mouse.move(
          box.x + box.width / 2 + 220,
          box.y + box.height / 2,
          {steps: 8},
        );
        await page.mouse.up();
        await page.evaluate(() => new Promise(requestAnimationFrame));
      }
      const pngs = [];
      const blankLines = [];
      for (let index = 0; index < 2; index++) {
        await page
          .locator('[data-window-tabs]')
          .filter({
            has: page.getByRole('button', {name: 'Add tab', exact: true}),
          })
          .first()
          .locator('[data-window-tab]')
          .nth(index)
          .click();
        await page.waitForFunction(
          code =>
            [
              ...document.querySelectorAll(
                '.cm-content[contenteditable="true"] .cm-line',
              ),
            ]
              .map(line => line.textContent)
              .join('\n') === code,
          codes[index],
        );
        blankLines.push({
          frame: await page
            .locator('[data-fit-scale] [data-watermark-frame]')
            .first()
            .boundingBox(),
          line: await editor().locator('.cm-line').nth(2).boundingBox(),
          code: await editor().evaluate(element => {
            const range = document.createRange();
            const boxes = [...element.querySelectorAll('.cm-line')]
              .filter(line => line.textContent)
              .map(line => {
                range.selectNodeContents(line);
                return range.getBoundingClientRect();
              });
            const x = Math.min(...boxes.map(box => box.x));
            const y = Math.min(...boxes.map(box => box.y));
            return {
              x,
              y,
              width: Math.max(...boxes.map(box => box.right)) - x,
              height: Math.max(...boxes.map(box => box.bottom)) - y,
            };
          }),
        });
        const downloading = page.waitForEvent('download');
        await page.locator('[data-export-image]').click();
        const path = resolve(out, `counter-${size}-static-${index}.png`);
        await (await downloading).saveAs(path);
        pngs.push(PNG.sync.read(await readFile(path)));
      }
      await page.locator('[data-animate-toggle]').click();
      await open();
      await ready();
      const name = `animation-counter-${size}`;
      const video = await exportFile(name);
      const decodedClip = execFileSync(
        'ffmpeg',
        [
          '-v',
          'error',
          '-i',
          resolve(out, `${name}.mp4`),
          '-f',
          'framemd5',
          'pipe:1',
        ],
        {encoding: 'utf8'},
      );
      if (naturalClip)
        assert.equal(
          decodedClip,
          naturalClip,
          'resizing the live editor does not change a natural animation',
        );
      naturalClip ??= decodedClip;
      const job = await page.evaluate(() => window.__mp4Jobs.at(-1));
      const holds = await page.evaluate(() => {
        const {scenes, pixelRatio} = window.__mp4LastJob;
        return [scenes[0].css, scenes.at(-1).css].map(css => {
          const [, x, y] = /translate\(([\d.]+)px,([\d.]+)px\)/.exec(css);
          return {
            x: Math.round(Number(x) * pixelRatio),
            y: Math.round(Number(y) * pixelRatio),
          };
        });
      });
      const lastHold =
        job.scenes.slice(0, -1).reduce((n, scene) => n + scene.durationMs, 0) /
        1000;
      const differences = [];
      for (let index = 0; index < 2; index++) {
        const decodedPath = resolve(out, `counter-${size}-video-${index}.png`);
        execFileSync('ffmpeg', [
          '-v',
          'error',
          '-ss',
          String(index ? lastHold : 0),
          '-i',
          resolve(out, `${name}.mp4`),
          '-frames:v',
          '1',
          '-y',
          decodedPath,
        ]);
        const decoded = PNG.sync.read(await readFile(decodedPath));
        const png = pngs[index];
        const cropped = new PNG({width: png.width, height: png.height});
        PNG.bitblt(
          decoded,
          cropped,
          holds[index].x,
          holds[index].y,
          Math.min(png.width, decoded.width - holds[index].x),
          Math.min(png.height, decoded.height - holds[index].y),
          0,
          0,
        );
        // The third source line is blank. A wrapped createSignal call paints
        // coloured syntax on this row even when whole-frame pixel error is small.
        const {frame, line, code} = blankLines[index];
        assert.ok(frame && line, 'blank source line has measured bounds');
        const scaleX = png.width / frame.width;
        const scaleY = png.height / frame.height;
        const left = Math.ceil((line.x - frame.x) * scaleX + 4);
        const right = Math.floor((code.x + code.width - frame.x) * scaleX - 4);
        const top = Math.ceil((line.y - frame.y + line.height / 4) * scaleY);
        const bottom = Math.floor(
          (line.y - frame.y + (line.height * 3) / 4) * scaleY,
        );
        let ink = 0;
        for (let y = top; y < bottom; y++)
          for (let x = left; x < right; x++) {
            const offset = (y * cropped.width + x) * 4;
            const rgb = cropped.data.subarray(offset, offset + 3);
            if (
              Math.max(...rgb) > 100 &&
              Math.max(...rgb) - Math.min(...rgb) > 25
            )
              ink++;
          }
        assert.ok(
          ink / ((right - left) * (bottom - top)) < 0.001,
          'createSignal stays on its source line in the decoded video',
        );
        // The static PNG retains the live frame's width. Compare the code
        // inside it with the naturally sized, centered animation window.
        const bounds = {
          x: Math.floor((code.x - frame.x) * scaleX),
          y: Math.floor((code.y - frame.y) * scaleY),
          width: Math.ceil(code.width * scaleX),
          height: Math.ceil(code.height * scaleY),
        };
        const expected = new PNG({width: bounds.width, height: bounds.height});
        const actual = new PNG({width: bounds.width, height: bounds.height});
        PNG.bitblt(
          png,
          expected,
          bounds.x,
          bounds.y,
          bounds.width,
          bounds.height,
          0,
          0,
        );
        // The live editor's fit zoom rounds DOM bounds at display pixels.
        // Align within one CSS pixel at 2x before comparing glyph pixels.
        let different = 1;
        for (let y = -2; y <= 2; y++)
          for (let x = -2; x <= 2; x++) {
            PNG.bitblt(
              cropped,
              actual,
              bounds.x + x,
              bounds.y + y,
              bounds.width,
              bounds.height,
              0,
              0,
            );
            different = Math.min(
              different,
              pixelmatch(
                expected.data,
                actual.data,
                null,
                bounds.width,
                bounds.height,
                {threshold: 0.15},
              ) /
                (bounds.width * bounds.height),
            );
          }
        await writeFile(
          resolve(out, `counter-${size}-comparison-${index}.json`),
          JSON.stringify({bounds, different}, null, 2),
        );
        differences.push(different);
        assert.ok(
          different < 0.03,
          `${size} step ${index + 1} MP4/PNG parity ${(different * 100).toFixed(2)}% (wrap changes layout)`,
        );
      }
      await close();
      await page
        .getByRole('button', {name: 'Close animation', exact: true})
        .click();
      results.push({size, video, differences});
    }
    return results;
  }
  const gif = animationGifCases({
    page: () => page,
    out,
    setup,
    doctor,
    open,
    ready,
    close,
    choose,
    shot: name => shot(name),
    editor: () => editor(),
  });
  const stepSize = animationStepSizeCases({
    page: () => page,
    out,
    setup,
    doctor,
    open,
    ready,
    close,
    choose,
    editor: () => editor(),
  });
  return {
    stepSizeMp4: isolated('animation-mp4-step-size', stepSize.mp4),
    stepSizeGif: isolated('animation-gif-step-size', stepSize.gif),
    gifEstimates: async () => {
      const results = [];
      for (const fixture of [
        {
          name: 'estimate-1080p-fifty',
          lineCounts: [6, 8, 9],
          output: true,
          fps: 50,
          transition: 1000,
        },
        {
          name: 'estimate-1080p-twelve',
          output: true,
          steps: 4,
          transition: 1200,
          rotate: true,
        },
        {
          name: 'estimate-solid-1080p-twelve',
          output: true,
          steps: 4,
          transition: 1200,
          rotate: true,
          solid: true,
        },
        {
          name: 'estimate-solid-long-no-hint',
          output: true,
          steps: 9,
          transition: 1200,
          rotate: true,
          solid: true,
        },
        {name: 'heldout-solid-1x', lines: 12, scale: 1, solid: true},
        {name: 'heldout-solid-2x', lines: 12, scale: 2, solid: true},
        {
          name: 'heldout-solid-square',
          lines: 6,
          target: 'Square',
          fps: 50,
          steps: 4,
          transition: 800,
          solid: true,
        },
        {
          name: 'heldout-solid-portrait',
          lines: 3,
          target: 'LinkedIn portrait',
          transition: 1000,
          solid: true,
        },
        {
          name: 'heldout-solid-long-under-six',
          output: true,
          steps: 7,
          transition: 1200,
          rotate: true,
          solid: true,
        },
        {
          name: 'heldout-solid-over-eight',
          output: true,
          steps: 14,
          transition: 1200,
          rotate: true,
          solid: true,
        },
        {name: 'estimate-1080p-nine', lines: 9, output: true, transition: 900},
        {
          name: 'estimate-square-fifty',
          lines: 6,
          target: 'Square',
          fps: 50,
          steps: 4,
          transition: 800,
        },
        {
          name: 'estimate-portrait-gradient',
          lines: 3,
          target: 'LinkedIn portrait',
          transition: 1000,
        },
        {
          name: 'estimate-1080p-hidden',
          lines: 6,
          output: true,
          fps: 50,
          transition: 1000,
          hidden: true,
        },
        {name: 'estimate-short-1x', lines: 3, scale: 1},
        {name: 'estimate-short-2x', lines: 3, scale: 2},
        {name: 'estimate-hidden-2x', lines: 3, scale: 2, hidden: true},
        {name: 'estimate-twelve-lines-1x', scale: 1},
        {name: 'estimate-twelve-lines-2x', scale: 2},
        {
          name: 'estimate-twelve-steps-1x',
          scale: 1,
          steps: 12,
          transition: 1200,
        },
        {name: 'estimate-near-eight-1x', scale: 1, steps: 9, transition: 1200},
        {name: 'estimate-over-eight-1x', scale: 1, steps: 10, transition: 1200},
        {name: 'estimate-fifty-2x', scale: 2, fps: 50},
        {
          name: 'heldout-square-twelve',
          target: 'Square',
          steps: 4,
          transition: 900,
        },
        {
          name: 'heldout-portrait-nine',
          lines: 9,
          target: 'LinkedIn portrait',
          transition: 900,
        },
        {name: 'estimate-short-pink-hold-2x', scale: 2, palette: true},
      ].filter(
        f =>
          !process.env.VERIFY_GIF_FIXTURES ||
          process.env.VERIFY_GIF_FIXTURES.split(',').includes(f.name),
      ))
        results.push(
          await isolated(fixture.name, () => gif.measurements(fixture))(),
        );
      return results;
    },
    gifLayouts: isolated('animation-gif', gif.layouts),
    gifFallback: isolated('animation-gif-fallback', gif.fallback),
    layouts: isolated('animation-mp4', layouts),
    errors: isolated('animation-mp4-errors', errors),
    compositing: isolated('animation-mp4-compositing', compositing),
    modes: isolated('animation-mp4-modes', modes),
    parity: isolated('animation-mp4-parity', parity),
  };
}
