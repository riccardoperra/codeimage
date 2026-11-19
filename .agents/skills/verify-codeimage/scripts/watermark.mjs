import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {createRequire} from 'node:module';
import {PNG} from 'pngjs';
const require = createRequire(
  new URL('../../../../apps/codeimage/package.json', import.meta.url),
);
const {unzipSync} = require('fflate');

export async function verifyWatermark({
  page,
  out,
  download,
  section,
  windowStyle,
}) {
  const editor = page.locator('.cm-content[contenteditable="true"]').first();
  const originalCode = await editor.innerText();
  const long = 'export const greet = (name: string) => `Hello, ${name}!`;';
  const records = [];
  const sample = async (name, record = true) => {
    await page.evaluate(
      () =>
        new Promise(resolve =>
          requestAnimationFrame(() => requestAnimationFrame(resolve)),
        ),
    );
    await page.waitForFunction(
      () => {
        const slots = Array.from(
          document.querySelectorAll('[data-watermark-home]'),
        ).map(el => el.dataset.watermarkPlacement);
        return (
          slots.length >= 2 && slots.every(slot => slot && slot === slots[0])
        );
      },
      null,
      {timeout: 5000},
    );
    const frames = await page.evaluate(() =>
      Array.from(document.querySelectorAll('[data-watermark-frame]'))
        .map(frame => {
          const home = frame.querySelector('[data-watermark-home]');
          const logo =
            frame.querySelector('[data-watermark-moved] svg') ??
            home?.querySelector('svg');
          if (!home || !logo) return null;
          const rect = logo.getBoundingClientRect();
          const overlaps = r =>
            r.x < rect.right &&
            r.right > rect.x &&
            r.y < rect.bottom &&
            r.bottom > rect.y;
          const code = Array.from(frame.querySelectorAll('.cm-line')).flatMap(
            line => {
              const walker = document.createTreeWalker(
                line,
                NodeFilter.SHOW_TEXT,
              );
              const boxes = [];
              let node;
              while ((node = walker.nextNode())) {
                for (const m of node.textContent.matchAll(/\S+/gu)) {
                  const range = document.createRange();
                  range.setStart(node, m.index);
                  range.setEnd(node, m.index + m[0].length);
                  boxes.push(...range.getClientRects());
                }
              }
              return boxes;
            },
          );
          const signature = frame.querySelector(
            '[data-frame-signature]',
          )?.firstElementChild;
          const window = home.closest('[data-surface]');
          const controls = Array.from(
            window.querySelectorAll(
              '[data-watermark-obstacle],button,[role=tab]',
            ),
          );
          return {
            slot: home.dataset.watermarkPlacement,
            codeOverlap: code.some(overlaps),
            signatureOverlap:
              !!signature && overlaps(signature.getBoundingClientRect()),
            controlOverlap: controls.some(el =>
              overlaps(el.getBoundingClientRect()),
            ),
            logos: frame.querySelectorAll(
              '[data-watermark-home] svg,[data-watermark-moved] svg',
            ).length,
            width: rect.width,
          };
        })
        .filter(Boolean),
    );
    assert.ok(frames.length >= 2, 'live and export frames measured');
    for (const frame of frames) {
      assert.equal(frame.logos, 1, `${name}: one logo per frame`);
      assert.equal(frame.signatureOverlap, false, `${name}: signature clear`);
      assert.equal(frame.controlOverlap, false, `${name}: controls clear`);
      if (frame.slot !== 'unavoidable')
        assert.equal(frame.codeOverlap, false, `${name}: code clear`);
    }
    assert.equal(
      frames[0].slot,
      frames[1].slot,
      `${name}: live/export slot parity`,
    );
    if (record) records.push({name, frames});
    await writeFile(
      resolve(out, 'watermark.json'),
      JSON.stringify(records, null, 2),
    );
    return frames;
  };
  for (const style of [
    'macOS',
    'macOS gray',
    'macOS outline',
    'Windows',
    'Card',
    'Editor',
    'Terminal',
  ]) {
    await windowStyle(style);
    await editor.fill('x');
    const free = await sample(`${style}-free`);
    assert.ok(
      free.every(f => f.slot === 'home'),
      `${style}: original position stays`,
    );
    await editor.fill(long);
    const moved = await sample(`${style}-overlap`);
    assert.ok(
      moved.every(f => f.slot !== 'home' && f.slot !== 'unavoidable'),
      `${style}: original collision moves`,
    );
    await page.screenshot({
      path: resolve(out, `watermark-canvas-${style.replaceAll(' ', '-')}.png`),
    });
    await download(`watermark-${style.replaceAll(' ', '-')}.png`);
  }
  await windowStyle('Editor');
  if (process.env.VERIFY_WATERMARK_EXTRA === '1') {
    const fixed = 'x'.repeat(60);
    await editor.fill(`${fixed}\nx${' '.repeat(59)}`);
    const free = await sample('same-size-code-left', false);
    assert.ok(free.every(frame => frame.slot === 'home'));
    const size = () =>
      page.evaluate(() =>
        Array.from(document.querySelectorAll('[data-watermark-frame]')).map(
          frame => {
            const content = frame.querySelector('.cm-content');
            return [content.clientWidth, content.clientHeight];
          },
        ),
      );
    const before = await size();
    await editor.fill(`${fixed}\n${' '.repeat(59)}x`);
    const moved = await sample('same-size-code-right', false);
    const after = await size();
    assert.deepEqual(after, before, 'unscaled code dimensions stay unchanged');
    await writeFile(
      resolve(out, 'watermark-same-size.json'),
      JSON.stringify({before, after}, null, 2),
    );
    assert.ok(moved.every(frame => frame.slot !== 'home'));
  }
  await editor.fill(
    Array.from({length: 15}, (_, i) =>
      i === 14 ? long : `const line${i} = ${i};`,
    ).join('\n'),
  );
  await sample('15-lines');
  await editor.fill(long.repeat(6));
  await sample('wrapped');
  await editor.fill(long);
  const header = page
    .locator('[data-control="window.header"]')
    .getByRole('switch');
  await header.focus();
  await page.keyboard.press('Space');
  const noHeader = await sample('header-hidden');
  assert.ok(
    noHeader.every(f => f.slot.startsWith('frame-')),
    'without header use painted frame',
  );
  await section('frame');
  if (process.env.VERIFY_WATERMARK_EXTRA === '1') {
    await page.locator('#signature-options').click();
    await page
      .getByPlaceholder('@handle or profile link', {exact: true})
      .fill('@r');
    await page.keyboard.press('Escape');
    for (const position of ['Right', 'Left', 'Right']) {
      await page.locator('#signature-options').click();
      await page
        .locator('[data-control="signature.position"]')
        .getByRole('tab', {name: position, exact: true})
        .click();
      await page.keyboard.press('Escape');
      await sample(`short-signature-${position}`, false);
    }
  }
  await page.locator('#signature-options').click();
  await page
    .getByPlaceholder('@handle or profile link', {exact: true})
    .fill('@a_long_signature_that_must_never_touch_the_CodeImage_watermark');
  await page.keyboard.press('Escape');
  await sample('signature-long');
  await download('watermark-signature.png');
  for (const position of ['Left', 'Center', 'Right']) {
    await page.locator('#signature-options').click();
    await page
      .locator('[data-control="signature.position"]')
      .getByRole('tab', {name: position, exact: true})
      .click();
    await page.keyboard.press('Escape');
    await sample(`signature-${position}`);
  }
  for (const padding of [16, 32, 64, 128]) {
    await page
      .locator('[data-control="frame.padding"]')
      .getByRole('button')
      .click();
    await page
      .getByRole('option', {name: String(padding), exact: true})
      .click();
    await sample(`padding-${padding}`);
  }
  const opacity = page
    .locator('[data-control="frame.opacity"]')
    .getByRole('slider');
  await opacity.focus();
  await page.keyboard.press('Home');
  const transparent = await sample('frame-transparent');
  assert.ok(
    transparent.every(f => !f.slot.startsWith('frame-')),
    'transparent frame never hosts mark',
  );
  await opacity.focus();
  await page.keyboard.press('End');

  const visible = page
    .locator('[data-control="frame.visible"]')
    .getByRole('switch');
  await visible.focus();
  await page.keyboard.press('Space');
  const hidden = await sample('frame-hidden');
  assert.ok(
    hidden.every(f => !f.slot.startsWith('frame-')),
    'hidden frame never hosts mark',
  );
  await section('window');
  await header.focus();
  await page.keyboard.press('Space');
  const lastResort = await sample('tab-strip-last-resort');
  assert.ok(
    lastResort.every(f => f.slot === 'header-right'),
    'tab strip used after other regions unavailable',
  );
  await download('watermark-tab-strip-last-resort.png');
  await section('frame');
  await visible.focus();
  await page.keyboard.press('Space');
  await page.locator('[data-settings-trigger]').click();
  await page.locator('[data-settings-section="experiments"]').click();
  const renderer = page.locator('#settings-rendering-engine');
  await renderer.focus();
  await page.keyboard.press('Space');
  await page.getByRole('button', {name: 'Close', exact: true}).click();
  await section('frame');
  const aspectRatio = page
    .locator('[data-control="frame.aspectRatio"]')
    .getByRole('button', {name: 'Aspect ratio', exact: true});
  await aspectRatio.click();
  await page
    .getByRole('option', {name: 'LinkedIn portrait', exact: true})
    .click();
  await page.keyboard.press('Escape');
  await sample('social1080x1350');
  const social = PNG.sync.read(await download('watermark-social-takumi.png'));
  assert.equal(social.width, 1080);
  assert.equal(social.height, 1350);
  await section('frame');
  await aspectRatio.click();
  await page.getByRole('option', {name: 'Free size', exact: true}).click();
  await page.keyboard.press('Escape');
  await sample('takumi');
  await download('watermark-takumi.png');
  await section('window');
  const strip = page
    .locator('[data-window-tabs]')
    .filter({has: page.getByRole('button', {name: 'Add tab', exact: true})})
    .first();
  await strip.getByRole('button', {name: 'Add tab', exact: true}).click();
  await editor.fill('x');
  await sample('second-tab-short');
  await page.locator('[data-export-menu]').click();
  const [zip] = await Promise.all([
    page.waitForEvent('download', {timeout: 60000}),
    page.locator('[data-export-action="tabs"]').click(),
  ]);
  const file = resolve(out, 'watermark-tabs.zip');
  await zip.saveAs(file);
  const {readFile} = await import('node:fs/promises');
  const files = Object.values(unzipSync(await readFile(file)));
  assert.equal(files.length, 2);
  for (const bytes of files) PNG.sync.read(Buffer.from(bytes));

  await strip
    .locator('[data-active="true"]')
    .getByRole('button', {name: 'Close tab', exact: true})
    .click();
  await editor.fill(originalCode);
  await section('frame');
  await page.locator('#signature-options').click();
  await page
    .getByPlaceholder('@handle or profile link', {exact: true})
    .fill('');
  await page.keyboard.press('Escape');
  await page
    .locator('[data-control="frame.padding"]')
    .getByRole('button')
    .click();
  await page.getByRole('option', {name: '64', exact: true}).click();
  await windowStyle('macOS');
  await page.locator('[data-settings-trigger]').click();
  await page.locator('[data-settings-section="experiments"]').click();
  await page.locator('#settings-rendering-engine').focus();
  await page.keyboard.press('Space');
  await page.getByRole('button', {name: 'Close', exact: true}).click();
  await writeFile(
    resolve(out, 'watermark.json'),
    JSON.stringify(records, null, 2),
  );
}
