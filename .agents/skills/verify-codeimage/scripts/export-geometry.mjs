import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {PNG} from 'pngjs';

async function geometry(page) {
  const read = element => {
    const style = getComputedStyle(element);
    return {
      width: parseFloat(style.width),
      height: parseFloat(style.height),
      padding: style.padding,
    };
  };
  return {
    live: await page
      .locator('[data-fit-scale] [data-watermark-frame]')
      .evaluate(read),
    copy: await page.locator('[data-snapshot-frame]').evaluate(read),
    natural: await page.locator('[data-snapshot-frame]').evaluate(element => {
      const clone = element.cloneNode(true);
      clone.style.width = 'max-content';
      clone.style.height = 'auto';
      element.parentElement.append(clone);
      try {
        const style = getComputedStyle(clone);
        return {
          width: parseFloat(style.width),
          height: parseFloat(style.height),
        };
      } finally {
        clone.remove();
      }
    }),
    zoom: Number(
      await page.locator('[data-fit-scale]').getAttribute('data-fit-scale'),
    ),
  };
}

async function persisted(page) {
  return page.evaluate(
    () =>
      new Promise((resolve, reject) => {
        const request = indexedDB.open('keyval-store');
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          const database = request.result;
          const read = database
            .transaction('keyval')
            .objectStore('keyval')
            .get('document');
          read.onsuccess = () => {
            database.close();
            resolve(read.result);
          };
          read.onerror = () => {
            database.close();
            reject(read.error);
          };
        };
      }),
  );
}

async function capture(driver, out, name, records) {
  const {page, settings, closeSettings, download} = driver;
  await page.locator('[data-export-image]').hover();
  await page.waitForTimeout(500);
  const boxes = await geometry(page);
  const document = await persisted(page);
  assert.ok(document?.editor?.editors?.length, 'edited document persisted');
  for (const scale of [1, 2]) {
    await settings('export');
    await page
      .locator('[data-setting=export-format]')
      .getByRole('tab', {name: 'PNG', exact: true})
      .click();
    await page
      .locator('[data-setting=export-scale]')
      .getByRole('tab', {name: `${scale}x`, exact: true})
      .click();
    await closeSettings();
    const image = PNG.sync.read(await download(`${name}-${scale}x.png`));
    records.push({
      name,
      scale,
      ...boxes,
      width: image.width,
      height: image.height,
    });
    await writeFile(
      resolve(out, `${name}-${scale}x.json`),
      JSON.stringify(
        {
          ...document,
          format: 'png',
          scale,
          width: boxes.copy.width,
        },
        null,
        2,
      ),
    );
    await writeFile(
      resolve(out, `${name}-${scale}x-natural.json`),
      JSON.stringify(
        {
          ...document,
          format: 'png',
          scale,
        },
        null,
        2,
      ),
    );
  }
  await page.screenshot({path: resolve(out, `${name}.png`)});
  await writeFile(
    resolve(
      out,
      `${records[0].name === 'padding-before' ? 'export-padding-geometry' : 'export-fractional-geometry'}.json`,
    ),
    JSON.stringify(records, null, 2),
  );
}

function check(records, tolerance = 0.02) {
  for (const record of records) {
    for (const side of ['width', 'height']) {
      assert.ok(
        Math.abs(record.live[side] - record.copy[side]) <
          (record.zoom === 1 ? tolerance : 1 / record.zoom),
        `${record.name}: live ${side} ${record.live[side]}, copy ${record.copy[side]}`,
      );
      assert.equal(
        record[side],
        Math.round(record.copy[side]) * record.scale,
        `${record.name}: ${record.scale}x PNG ${side} follows export border box`,
      );
    }
  }
  return records;
}

async function verifyFractionalExport({fresh, out}) {
  const records = [];
  await fresh(
    {
      name: 'export-fractional-geometry',
      layout: 'inspector',
      viewport: {width: 1440, height: 1000},
    },
    async driver => {
      const {page, doctor, editor} = driver;
      await doctor('/', 'editor', undefined, page);
      await page
        .locator('[data-fit-scale] [aria-label="Tab name"] input')
        .fill('index.tsx');
      await page.keyboard.press('Escape');
      const documents = [
        ['short', 'const a = 1;'],
        [
          'sample',
          'function Counter() {\n  const [count, setCount] = createSignal(0);\n  return <div>The count is {count()}</div>;\n}',
        ],
        ['long', `const message = '${'fractional geometry '.repeat(5)}';`],
      ];
      for (const [name, code] of documents) {
        await editor().fill(code);
        await page.keyboard.press('Escape');
        await capture(driver, out, name, records);
      }
      await page.setViewportSize({width: 390, height: 844});
      await capture(driver, out, 'long-phone', records);
    },
  );
  assert.ok(
    records.some(record => record.zoom < 1),
    'fitted zoom exercised',
  );
  assert.ok(
    records.some(
      record =>
        Math.abs(record.live.width - Math.round(record.live.width)) > 0.1,
    ),
    'fractional width exercised',
  );
  return check(records);
}

async function verifyPaddingExport({fresh, out}) {
  const records = [];
  await fresh(
    {
      name: 'export-padding-geometry',
      layout: 'inspector',
      viewport: {width: 1440, height: 1000},
    },
    async driver => {
      const {page, doctor, editor, section} = driver;
      await doctor('/', 'editor', undefined, page);
      await page
        .locator('[data-fit-scale] [aria-label="Tab name"] input')
        .fill('index.tsx');
      await page.keyboard.press('Escape');
      await editor().fill('const padding = 1;');
      await page.keyboard.press('Escape');
      await capture(driver, out, 'padding-before', records);
      await section('frame');
      await page
        .locator('[data-control="frame.padding"]')
        .getByRole('button')
        .click();
      await page.getByRole('option', {name: '32', exact: true}).click();
      await capture(driver, out, 'padding-only', records);
      await page.locator('#signature-options').click();
      await page
        .getByPlaceholder('@handle or profile link', {exact: true})
        .fill('@geometry');
      await page.getByRole('tab', {name: 'Card', exact: true}).click();
      await page.keyboard.press('Escape');
      await capture(driver, out, 'signature-card', records);
      await page.locator('#signature-options').click();
      await page.getByRole('tab', {name: 'Minimal', exact: true}).click();
      await page.keyboard.press('Escape');
      await capture(driver, out, 'signature-minimal', records);
    },
  );
  return check(
    records.filter(record => record.name.startsWith('signature')),
    0.51,
  );
}

export async function auditFrameGeometry({feature, fresh, out}) {
  const {verifyColdStart, verifyExportScreen} =
    await import('./frame-regressions.mjs');
  await feature('export-fractional-geometry', () =>
    verifyFractionalExport({fresh, out}),
  );
  await feature('export-padding-geometry', () =>
    verifyPaddingExport({fresh, out}),
  );
  await feature('frame-cold-start', () => verifyColdStart({fresh, out}));
  await feature('export-screen-parity', () => verifyExportScreen({fresh, out}));
}
