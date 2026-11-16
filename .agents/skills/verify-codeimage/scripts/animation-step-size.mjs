import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readFile, writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {PNG} from 'pngjs';
import pixelmatch from 'pixelmatch';

// Only visible controls create/edit this document. Worker observation records
// the export boundary; expected last-line pixels come from a separate PNG.
export function animationStepSizeCases({
  page: currentPage,
  out,
  setup,
  doctor,
  open,
  ready,
  close,
  choose,
  editor,
}) {
  const codes = [
    'const small = 1;',
    [
      ...Array.from({length: 11}, (_, i) => `const row${i} = ${i};`),
      'const lastLine = "BOTTOM_SENTINEL_WWWWWWWWWWWWW";',
    ].join('\n'),
  ];
  const digest = bytes => createHash('sha256').update(bytes).digest('hex');
  const tabStrip = () =>
    currentPage()
      .locator('[data-window-tabs]')
      .filter({
        has: currentPage().getByRole('button', {name: 'Add tab', exact: true}),
      })
      .first();
  async function select(index) {
    await tabStrip().locator('[data-window-tab]').nth(index).click();
    await currentPage().waitForFunction(
      code =>
        [
          ...document.querySelectorAll(
            '.cm-content[contenteditable="true"] .cm-line',
          ),
        ]
          .map(e => e.textContent)
          .join('\n') === code,
      codes[index],
    );
    await currentPage().evaluate(
      () =>
        new Promise(resolve =>
          requestAnimationFrame(() => requestAnimationFrame(resolve)),
        ),
    );
  }
  async function instrument() {
    await currentPage().evaluate(() => {
      if (window.__stepSizeInstrumented) return;
      window.__stepSizeInstrumented = true;
      const send = Worker.prototype.postMessage;
      Worker.prototype.postMessage = function (message, ...rest) {
        if (message?.kind === 'export') window.__stepSizeJob = message.job;
        return send.call(this, message, ...rest);
      };
    });
  }
  const decode = file =>
    execFileSync(
      'ffmpeg',
      [
        '-v',
        'error',
        '-i',
        file,
        '-fps_mode',
        'passthrough',
        '-pix_fmt',
        'rgba',
        '-f',
        'rawvideo',
        'pipe:1',
      ],
      {maxBuffer: 512 * 1024 * 1024},
    );
  async function run(format) {
    await setup(12, codes, false);
    const page = currentPage();
    // A 1x PNG is the independent, uncut reference, including the full final
    // source line. Keep this download for main/fix byte-identity checks too.
    await page.locator('[data-settings-trigger]').click();
    await page.locator('[data-settings-section="export"]').click();
    await page
      .locator('[data-setting="export-scale"]')
      .getByRole('tab', {name: '1x', exact: true})
      .click();
    await page.getByRole('button', {name: 'Close', exact: true}).click();
    await page.getByRole('alertdialog').waitFor({state: 'hidden'});
    await select(1);
    const bounds = await page.evaluate(() => {
      const frame = document
        .querySelector('[data-fit-scale] [data-watermark-frame]')
        .getBoundingClientRect();
      const lines = document.querySelectorAll(
        '.cm-content[contenteditable="true"] .cm-line',
      );
      const line = lines[lines.length - 1];
      const range = document.createRange();
      range.selectNodeContents(line);
      const box = range.getBoundingClientRect();
      return {
        frame: {width: frame.width, height: frame.height},
        line: {
          x: box.x - frame.x,
          y: box.y - frame.y,
          width: box.width,
          height: box.height,
        },
      };
    });
    const pngPath = resolve(out, `step-size-${format}-static.png`);
    const downloading = page.waitForEvent('download');
    await page.locator('[data-export-image]').click();
    await (await downloading).saveAs(pngPath);
    const pngBytes = await readFile(pngPath);
    const png = PNG.sync.read(pngBytes);
    const scale = png.width / bounds.frame.width;
    const crop = {
      x: Math.round(bounds.line.x * scale),
      y: Math.round(bounds.line.y * scale),
      width: Math.round(bounds.line.width * scale),
      height: Math.round(bounds.line.height * scale),
    };
    const template = new PNG({width: crop.width, height: crop.height});
    PNG.bitblt(png, template, crop.x, crop.y, crop.width, crop.height, 0, 0);
    await writeFile(
      resolve(out, `step-size-${format}-last-line.png`),
      PNG.sync.write(template),
    );
    if (process.env.VERIFY_STATIC_BASELINE) {
      assert.deepEqual(
        pngBytes,
        await readFile(
          resolve(
            process.env.VERIFY_STATIC_BASELINE,
            `step-size-${format}-static.png`,
          ),
        ),
        'static PNG stays byte-identical to main',
      );
    }
    await page.locator('[data-animate-toggle]').click();
    await page.locator('[data-animate-panel]').waitFor();
    const records = [];
    const failures = [];
    let reference;
    for (const layout of ['inspector', 'dock', 'studio']) {
      if (layout !== 'inspector') await doctor('/', 'editor', layout);
      for (const reloaded of [false, true]) {
        for (const active of [0, 1]) {
          await select(active);
          if (reloaded) {
            // Wait for the real IndexedDB save rather than seeding app state.
            await page.waitForFunction(
              codes =>
                new Promise((resolve, reject) => {
                  const request = indexedDB.open('keyval-store');
                  request.onerror = () => reject(request.error);
                  request.onsuccess = () => {
                    const db = request.result;
                    const read = db
                      .transaction('keyval')
                      .objectStore('keyval')
                      .get('document');
                    read.onsuccess = () => {
                      const stored = read.result?.editor?.editors?.map(
                        tab => tab.code,
                      );
                      resolve(JSON.stringify(stored) === JSON.stringify(codes));
                      db.close();
                    };
                    read.onerror = () => {
                      reject(read.error);
                      db.close();
                    };
                  };
                }),
              codes,
            );
            await page.reload();
            await editor().waitFor();
            await page.evaluate(() => document.fonts.ready);
            await select(active);
          }
          await instrument();
          await open();
          await ready();
          if (format === 'gif') {
            await page
              .locator('[data-animation-export]')
              .getByRole('radio', {name: 'GIF', exact: true})
              .focus();
            await page.keyboard.press('Space');
            await ready();
          }
          await choose('Scale', '1×');
          await choose('Frame rate', format === 'gif' ? '25 fps' : '24 fps');
          const name = `step-size-${format}-${layout}-${reloaded ? 'reload' : 'live'}-${active}`;
          const pending = page.waitForEvent('download', {timeout: 180000});
          await page
            .locator('[data-animation-export]')
            .getByRole('button', {
              name: `Export ${format.toUpperCase()}`,
              exact: true,
            })
            .click();
          const path = resolve(out, `${name}.${format}`);
          await (await pending).saveAs(path);
          if (!records.length) {
            const project = await page.evaluate(
              () =>
                new Promise((resolve, reject) => {
                  const request = indexedDB.open('keyval-store');
                  request.onerror = () => reject(request.error);
                  request.onsuccess = () => {
                    const db = request.result;
                    const read = db
                      .transaction('keyval')
                      .objectStore('keyval')
                      .get('document');
                    read.onsuccess = () => {
                      resolve(read.result);
                      db.close();
                    };
                    read.onerror = () => {
                      reject(read.error);
                      db.close();
                    };
                  };
                }),
            );
            await writeFile(
              resolve(out, `step-size-${format}-project.json`),
              JSON.stringify(project, null, 2),
            );
          }
          const job = await page.evaluate(() => {
            const {config, scenes, pixelRatio} = window.__stepSizeJob;
            return {
              config,
              pixelRatio,
              scenes: scenes.map(scene => ({
                durationMs: scene.durationMs,
                html: scene.html,
                css: scene.css,
              })),
            };
          });
          await writeFile(
            resolve(out, `${name}-job.json`),
            JSON.stringify(job, null, 2),
          );
          const {width, height} = job.config;
          const bytes = decode(path);
          const frameBytes = width * height * 4;
          assert.equal(bytes.length % frameBytes, 0);
          const timing = JSON.parse(
            execFileSync(
              'ffprobe',
              [
                '-v',
                'error',
                '-show_entries',
                'frame=pts_time,duration_time',
                '-of',
                'json',
                path,
              ],
              {encoding: 'utf8'},
            ),
          );
          const last = new PNG({width, height});
          last.data.set(bytes.subarray(bytes.length - frameBytes));
          await writeFile(
            resolve(out, `${name}-last-hold.png`),
            PNG.sync.write(last),
          );
          // The tallest step is also the widest: its natural frame starts at
          // (0,0). Search +/-2px for rasterizer rounding, not for a missing row.
          let lastLineDifference = 1;
          for (let dy = -2; dy <= 2; dy++)
            for (let dx = -2; dx <= 2; dx++) {
              if (
                crop.x + dx < 0 ||
                crop.y + dy < 0 ||
                crop.x + dx + crop.width > width ||
                crop.y + dy + crop.height > height
              )
                continue;
              const actual = new PNG({width: crop.width, height: crop.height});
              PNG.bitblt(
                last,
                actual,
                crop.x + dx,
                crop.y + dy,
                crop.width,
                crop.height,
                0,
                0,
              );
              lastLineDifference = Math.min(
                lastLineDifference,
                pixelmatch(
                  template.data,
                  actual.data,
                  null,
                  crop.width,
                  crop.height,
                  {threshold: 0.2},
                ) /
                  (crop.width * crop.height),
              );
            }
          // Padding is uninterrupted across both sides of the smaller first
          // hold. A restarted gradient produces a large adjacent-column jump.
          const first = bytes.subarray(0, frameBytes);
          const firstPng = new PNG({width, height});
          firstPng.data.set(first);
          await writeFile(
            resolve(out, `${name}-first-hold.png`),
            PNG.sync.write(firstPng),
          );
          const firstTop = Number(
            /transform:translate\([^,]+,([\d.]+)px\)/.exec(
              job.scenes[0].css,
            )?.[1] ?? 0,
          );
          let seam = 0;
          for (let y = firstTop + 2; y < firstTop + 12; y++)
            for (let x = 1; x < width; x++)
              for (let c = 0; c < 3; c++)
                seam = Math.max(
                  seam,
                  Math.abs(
                    first[(y * width + x) * 4 + c] -
                      first[(y * width + x - 1) * 4 + c],
                  ),
                );
          const darkPixels = rgba => {
            let count = 0;
            const y = Math.floor(height / 2);
            for (let x = 0; x < width; x++) {
              const offset = (y * width + x) * 4;
              if (Math.max(...rgba.subarray(offset, offset + 3)) < 60) count++;
            }
            return count;
          };
          const smallWindowDarkPixels = darkPixels(first);
          const tallWindowDarkPixels = darkPixels(last.data);
          const record = {
            name,
            width,
            height,
            frames: bytes.length / frameBytes,
            decodedSha256: digest(bytes),
            timingSha256: digest(JSON.stringify(timing)),
            lastLineDifference,
            seam,
            smallWindowDarkPixels,
            tallWindowDarkPixels,
          };
          records.push(record);
          await writeFile(
            resolve(out, `step-size-${format}-measurements.json`),
            JSON.stringify(
              {staticSha256: digest(pngBytes), crop, records, failures},
              null,
              2,
            ),
          );
          if (lastLineDifference >= 0.01)
            failures.push(
              `${name}: final line differs by ${(lastLineDifference * 100).toFixed(2)}%`,
            );
          if (seam > 8) failures.push(`${name}: background seam ${seam}`);
          if (smallWindowDarkPixels >= tallWindowDarkPixels * 0.8)
            failures.push(
              `${name}: the small window is stretched to the tall step's width`,
            );
          if (
            reference &&
            (reference.width !== width ||
              reference.height !== height ||
              reference.decodedSha256 !== record.decodedSha256 ||
              reference.timingSha256 !== record.timingSha256)
          )
            failures.push(
              `${name}: decoded clip changes with active tab/layout/reload`,
            );
          reference ??= record;
          console.log(`STEP SIZE ${JSON.stringify(record)}`);
          await close();
        }
      }
    }
    await writeFile(
      resolve(out, `step-size-${format}-measurements.json`),
      JSON.stringify(
        {staticSha256: digest(pngBytes), crop, records, failures},
        null,
        2,
      ),
    );
    assert.deepEqual(
      failures,
      [],
      'natural steps are uncut, seamless and independent of the live editor',
    );
    return records;
  }
  return {mp4: () => run('mp4'), gif: () => run('gif')};
}
