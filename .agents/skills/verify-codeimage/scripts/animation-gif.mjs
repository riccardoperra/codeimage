import assert from 'node:assert/strict';
import {readFile, writeFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {cpus, loadavg} from 'node:os';
import {resolve} from 'node:path';
import {PNG} from 'pngjs';
import {decodeGif} from '../../../../apps/codeimage/src/core/gif/decode.test-utils.ts';

// Real downloads are decoded with #762's libwebp-checked decoder. Re-render
// the captured worker job with the same Takumi WASM, retaining two frames.
async function quality(file, job, out, name) {
  const {Renderer} = createRequire(
    new URL('../../../../apps/codeimage/package.json', import.meta.url),
  )('@takumi-rs/wasm/node');
  const renderer = new Renderer();
  for (const font of job.resources.fonts)
    await renderer.registerFont({...font, data: new Uint8Array(font.data)});
  const bytes = await readFile(file);
  const decoder = decodeGif(bytes);
  let current = decoder.next();
  let next = decoder.next();
  let gifFrames = 0,
    durationMs = 0,
    localPalettes = 0;
  const count = frame => {
    if (frame.done) return;
    gifFrames++;
    durationMs += frame.value.delayMs;
    localPalettes += Number(frame.value.localPalette);
    assert.equal(
      frame.value.disposal,
      1,
      'opaque full frames retain no ghosts',
    );
  };
  count(current);
  count(next);
  const total = Math.ceil(
    (job.scenes.reduce((n, s) => n + s.durationMs, 0) * job.config.fps) / 1000,
  );
  let holes = 0,
    ghosts = 0,
    flickered = 0,
    still = 0,
    error = 0,
    maxDelta = 0,
    wrong = 0;
  let previous;
  const kept = [];
  for (let i = 0; i < total; i++) {
    const ms = Math.floor((i * 1000) / job.config.fps);
    while (!next.done && next.value.startMs <= ms) {
      current = next;
      next = decoder.next();
      count(next);
    }
    assert.ok(!current.done);
    let sceneIndex = 0,
      sceneStart = 0;
    while (
      sceneIndex < job.scenes.length - 1 &&
      ms >= sceneStart + job.scenes[sceneIndex].durationMs
    )
      sceneStart += job.scenes[sceneIndex++].durationMs;
    const scene = job.scenes[sceneIndex];
    const raw = await renderer.render(scene.html, {
      width: job.config.width,
      height: job.config.height,
      devicePixelRatio: job.pixelRatio,
      css: [...job.resources.css, job.css, scene.css],
      fontFamilies: job.resources.fontFamilies,
      timeMs: ms - sceneStart,
      format: 'raw',
    });
    const shown = current.value.rgba;
    for (let p = 0; p < raw.length; p += 4) {
      if (raw[p + 3] === 255 && shown[p + 3] === 0) holes++;
      if (raw[p + 3] === 0 && shown[p + 3] === 255) ghosts++;
      assert.equal(shown[p + 3], 255, 'every GIF pixel is opaque');
      let worst = 0;
      for (let c = 0; c < 3; c++) {
        const d = Math.abs(raw[p + c] - shown[p + c]);
        error += d;
        worst = Math.max(worst, d);
      }
      maxDelta = Math.max(maxDelta, worst);
      wrong += Number(worst > 48);
      if (
        previous &&
        raw[p] === previous.raw[p] &&
        raw[p + 1] === previous.raw[p + 1] &&
        raw[p + 2] === previous.raw[p + 2] &&
        raw[p + 3] === previous.raw[p + 3]
      ) {
        still++;
        if (
          shown[p] !== previous.shown[p] ||
          shown[p + 1] !== previous.shown[p + 1] ||
          shown[p + 2] !== previous.shown[p + 2]
        )
          flickered++;
      }
    }
    if ([0, Math.floor(total / 2), total - 1].includes(i)) {
      const pair = [];
      for (const rgba of [raw, shown]) {
        const factor = 4,
          w = Math.floor(job.config.width / factor),
          h = Math.floor(job.config.height / factor);
        const png = new PNG({width: w, height: h});
        for (let y = 0; y < h; y++)
          for (let x = 0; x < w; x++)
            png.data.set(
              rgba.subarray(
                (y * factor * job.config.width + x * factor) * 4,
                (y * factor * job.config.width + x * factor) * 4 + 4,
              ),
              (y * w + x) * 4,
            );
        pair.push(png);
      }
      kept.push(pair);
    }
    previous = {raw, shown};
  }
  while (!next.done) {
    next = decoder.next();
    count(next);
  }
  const sheet = new PNG({
    width: kept[0][0].width * 3,
    height: kept[0][0].height * 2,
  });
  kept.forEach((pair, x) =>
    pair.forEach((png, y) =>
      PNG.bitblt(
        png,
        sheet,
        0,
        0,
        png.width,
        png.height,
        x * png.width,
        y * png.height,
      ),
    ),
  );
  await writeFile(resolve(out, `${name}-raw-gif.png`), PNG.sync.write(sheet));
  const result = {
    gifFrames,
    durationMs,
    localPalettes,
    holes,
    ghosts,
    flicker: still ? flickered / still : 0,
    errorMean: error / (total * job.config.width * job.config.height * 3),
    maxDelta,
    wrong,
  };
  assert.equal(localPalettes, 0, 'only a global palette');
  assert.equal(holes, 0);
  assert.equal(ghosts, 0);
  assert.equal(flickered, 0);
  assert.ok(result.errorMean < 2, `mean colour error ${result.errorMean}`);
  assert.ok(
    maxDelta <= 65,
    `worst channel error ${maxDelta}, bakeoff limit 65`,
  );
  assert.equal(durationMs, (total * 1000) / job.config.fps);
  assert.ok(gifFrames < total, 'identical holds merge');
  return result;
}

export function animationGifCases({
  page: getPage,
  out,
  setup,
  doctor,
  open,
  ready,
  close,
  choose,
  shot,
  editor,
}) {
  const dialog = () => getPage().locator('[data-animation-export]');
  async function selectGif() {
    await dialog().getByRole('radio', {name: 'GIF', exact: true}).focus();
    await getPage().keyboard.press('Space');
    await ready();
    assert.equal(
      await dialog().getByRole('radio', {name: 'GIF', exact: true}).isChecked(),
      true,
    );
  }
  async function chooseRate(fps) {
    await dialog()
      .getByRole('button', {name: /Frame rate/})
      .click();
    await getPage()
      .getByRole('option', {name: `${fps} fps`, exact: true})
      .click();
    await ready();
    assert.match(
      await dialog()
        .getByRole('button', {name: /Frame rate/})
        .innerText(),
      new RegExp(`${fps} fps`),
    );
  }
  async function instrument() {
    await getPage().evaluate(() => {
      window.__gifDone = undefined;
      window.__gifTasks = [];
      new PerformanceObserver(list =>
        window.__gifTasks.push(
          ...list
            .getEntries()
            .map(e => ({start: e.startTime, duration: e.duration})),
        ),
      ).observe({type: 'longtask'});
      const post = Worker.prototype.postMessage;
      Worker.prototype.postMessage = function (message, ...args) {
        if (message?.kind === 'export') {
          window.__gifJob = message.job;
          this.addEventListener('message', ({data}) => {
            if (data.kind === 'done') {
              const {buffer, ...stats} = data;
              window.__gifDone = stats;
            }
          });
        }
        return post.call(this, message, ...args);
      };
    });
  }
  async function exportGif(name, compare = false) {
    const page = getPage();
    const before = loadavg();
    const pageStarted = await page.evaluate(() => performance.now());
    const started = performance.now();
    const download = page.waitForEvent('download', {timeout: 180000});
    await dialog()
      .getByRole('button', {name: 'Export GIF', exact: true})
      .click();
    await dialog().getByRole('progressbar').waitFor({timeout: 60000});
    await shot(`${name}-progress`);
    const file = resolve(out, `${name}.gif`);
    const got = await download;
    assert.equal(got.suggestedFilename(), 'codeimage-animation.gif');
    await got.saveAs(file);
    const wallMs = performance.now() - started;
    const stats = await page.evaluate(() => window.__gifDone);
    const longTasks = await page.evaluate(
      start => window.__gifTasks.filter(t => t.start >= start),
      pageStarted,
    );
    assert.ok(stats?.frames > 0, 'worker completed a real encode');
    const bytes = await readFile(file);
    assert.equal(bytes.toString('ascii', 0, 6), 'GIF89a');
    const frames = decodeGif(bytes);
    let durationMs = 0,
      frameCount = 0;
    for (const frame of frames) {
      durationMs += frame.delayMs;
      frameCount++;
      assert.equal(frame.localPalette, false);
    }
    assert.equal(durationMs, stats.durationMs);
    const job = await page.evaluate(() => {
      const job = window.__gifJob;
      return {
        ...job,
        resources: {
          ...job.resources,
          fonts: job.resources.fonts.map(font => ({
            ...font,
            data: Array.from(font.data),
          })),
        },
      };
    });
    const fidelity = compare ? await quality(file, job, out, name) : undefined;
    await shot(name);
    const result = {
      name,
      width: job.config.width,
      height: job.config.height,
      fps: job.config.fps,
      bytes: bytes.length,
      wallMs,
      longestMainThreadTaskMs: Math.max(0, ...longTasks.map(t => t.duration)),
      stats,
      frameCount,
      durationMs,
      loadBefore: before,
      loadAfter: loadavg(),
      cores: cpus().length,
      fidelity,
    };
    await writeFile(
      resolve(out, `${name}.json`),
      JSON.stringify(result, null, 2),
    );
    return result;
  }
  async function layouts() {
    await setup(12);
    const page = getPage();
    // Three holds of 600 ms and two 600 ms transitions make a 3 s clip.
    const holds = page.locator('[data-animation-segment][data-kind="hold"]');
    for (let i = 0; i < 3; i++) {
      await holds.nth(i).click();
      await page.locator('#animationDuration-input').fill('600');
      await page.locator('#animationDuration-input').press('Enter');
    }
    const transitions = page.locator(
      '[data-animation-segment][data-kind="transition"]',
    );
    for (let i = 0; i < 2; i++) {
      await transitions.nth(i).click();
      await page.locator('#animationDuration-input').fill('600');
      await page.locator('#animationDuration-input').press('Enter');
    }
    await page.waitForTimeout(500);
    const results = [];
    for (const layout of ['inspector', 'dock', 'studio']) {
      if (layout !== 'inspector') await doctor('/', 'editor', layout, page);
      await instrument();
      await open();
      await ready();
      assert.equal(
        await dialog()
          .getByRole('radio', {name: 'MP4', exact: true})
          .isChecked(),
        true,
        'MP4 remains default',
      );
      await selectGif();
      const formatRow = await dialog()
        .getByRole('radiogroup', {name: 'Format', exact: true})
        .locator('..')
        .boundingBox();
      assert.ok(
        formatRow && formatRow.height >= 36 && formatRow.height <= 40.1,
        'format row keeps the relaxed 36–40 px density',
      );
      assert.match(
        await dialog()
          .getByRole('button', {name: /Frame rate/})
          .innerText(),
        /25 fps/,
      );
      assert.match(
        await dialog().locator('[data-animation-size-estimate]').innerText(),
        /Estimated size/,
      );
      results.push(await exportGif(`gif-${layout}-25`, layout === 'inspector'));
      await close();
    }
    await open();
    await ready();
    await chooseRate(60); // 60 persists from MP4 into GIF.
    await selectGif();
    assert.match(
      await dialog().locator('[data-gif-fps-note]').innerText(),
      /50 fps.*60 fps/,
    );
    results.push(await exportGif('gif-60-as-50', true));
    // Optional interleaved measurements reuse the visible format controls.
    // Output paths overwrite each rate's prior repeat to keep evidence small.
    for (let run = 1; run < Number(process.env.VERIFY_GIF_RUNS ?? 1); run++) {
      await chooseRate(25);
      const low = await exportGif('gif-repeat-25');
      assert.equal(low.fps, 25);
      results.push(low);
      await chooseRate(50);
      const high = await exportGif('gif-repeat-50');
      assert.equal(high.fps, 50);
      results.push(high);
    }
    await chooseRate(50);
    assert.match(
      await dialog()
        .getByRole('button', {name: /Frame rate/})
        .innerText(),
      /50 fps/,
    );
    assert.equal(await dialog().locator('[data-gif-fps-note]').count(), 0);
    await close();
    // Layout reloads retain the document but close the Animate island.
    if (!(await page.locator('[data-animate-panel]').isVisible())) {
      await page.locator('[data-animate-toggle]').click();
      await page.locator('[data-animate-panel]').waitFor();
    }
    // Ten seconds with four seconds of motion exceeds the GIF recommendation.
    const segments = page.locator('[data-animation-segment]');
    for (let i = 0; i < 5; i++) {
      await segments.nth(i).click();
      await page.locator('#animationDuration-input').fill('2000');
      await page.locator('#animationDuration-input').press('Enter');
    }
    await open();
    await ready();
    await selectGif();
    await choose('Output size', 'End');
    assert.ok(
      await dialog().locator('[data-gif-suggestion]').isVisible(),
      'large GIF suggests MP4',
    );
    let downloads = 0;
    const downloaded = () => downloads++;
    page.on('download', downloaded);
    try {
      await dialog()
        .getByRole('button', {name: 'Export GIF', exact: true})
        .click();
      await dialog().getByRole('progressbar').waitFor({timeout: 60000});
      await dialog().getByRole('button', {name: 'Cancel', exact: true}).click();
      await dialog().waitFor({state: 'hidden'});
      await page.waitForTimeout(500);
      assert.equal(downloads, 0);
      await editor().fill('const afterGifCancel = true;');
      assert.match(await editor().innerText(), /afterGifCancel/);
    } finally {
      page.off('download', downloaded);
    }
    return results;
  }
  async function fallback() {
    await setup(3, [
      '',
      'function expanded() {\n  return [1, 2, 3];\n}\nconst more = expanded();',
      'const done = true;',
    ]);
    const page = getPage();
    const results = [];
    for (const mode of ['config', 'missing']) {
      await page.evaluate(mode => {
        window.__videoEncoder = VideoEncoder;
        if (mode === 'missing') window.VideoEncoder = undefined;
        else {
          window.__support = VideoEncoder.isConfigSupported;
          VideoEncoder.isConfigSupported = async () => ({supported: false});
        }
      }, mode);
      try {
        await instrument();
        await open();
        await ready();
        assert.equal(
          await dialog()
            .getByRole('radio', {name: 'GIF', exact: true})
            .isChecked(),
          true,
        );
        assert.equal(
          await dialog()
            .getByRole('radio', {name: 'MP4', exact: true})
            .isDisabled(),
          true,
        );
        assert.match(
          await dialog().innerText(),
          mode === 'missing' ? /MP4 needs WebCodecs/ : /MP4 is unavailable/,
        );
        results.push(
          await exportGif(`gif-fallback-${mode}`, mode === 'config'),
        );
        await close();
      } finally {
        await page.evaluate(() => {
          window.VideoEncoder = window.__videoEncoder;
          if (window.__support)
            VideoEncoder.isConfigSupported = window.__support;
        });
      }
    }
    return results;
  }
  return {layouts, fallback};
}
