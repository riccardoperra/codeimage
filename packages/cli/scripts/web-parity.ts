import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {mkdir, readFile, writeFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {resolve} from 'node:path';
import {parseArgs} from 'node:util';
import type {Page} from 'playwright';
import {PNG} from 'pngjs';
import type * as Parity from '../../../scripts/parity/lib';
import {parsePreset} from '../src/snapshot';

const parity: typeof Parity = createRequire(import.meta.url)(
  '../../../scripts/parity/lib.ts',
);
const {diffPng, launchChrome, MAX_DIFF_PERCENT, selectTheme} = parity;

const {values} = parseArgs({
  options: {
    url: {type: 'string', default: 'http://localhost:4434'},
    out: {type: 'string', default: '/tmp/swarm-p4-restack'},
  },
});
const out = resolve(values.out);
const code = 'const answer: number = 42;\nconsole.log(answer);';
const rows: {
  lane: number;
  scale: number;
  dpr: number;
  width: number;
  height: number;
  percent: number;
}[] = [];

async function copyPreset(page: Page, name: string, path: string) {
  console.log(`Copying ${name}`);
  await page
    .getByRole('button', {name: 'Show your presets', exact: true})
    .click();
  await page.getByRole('button', {name: 'Add preset', exact: true}).click();
  const dialog = page
    .locator('[data-panel-size="xs"]')
    .filter({hasText: 'Add a new preset'});
  await dialog.locator('input').fill(name);
  await dialog.getByText('Confirm', {exact: true}).click();
  await page.locator('li').filter({hasText: name}).getByRole('button').click();
  await page
    .getByRole('menuitem', {name: 'Copy as CLI config', exact: true})
    .click();
  const text = await page.evaluate(() => navigator.clipboard.readText());
  parsePreset(text);
  await writeFile(path, text);
  await page.getByRole('button', {name: 'Close', exact: true}).click();
}

async function compare(page: Page, lane: number, scale: number) {
  const prefix = resolve(out, `lane-${lane}-${scale}x`);
  await copyPreset(page, `P4 lane ${lane}`, `${prefix}-preset.json`);
  await page.evaluate(() => document.fonts.ready);
  const dpr = await page.evaluate(() => window.devicePixelRatio);
  assert.equal(dpr, scale, 'Chrome must use its native device scale');
  const node = page.locator('[class*="Frame_previewWrapper"]');
  await node
    .locator('.cm-line')
    .filter({hasText: 'console.log(answer);'})
    .waitFor();
  const backdrop = await page.addStyleTag({
    content: `
      html, body { background: transparent !important; }
      body * { visibility: hidden !important; }
      [class*="Frame_previewWrapper"], [class*="Frame_previewWrapper"] * { visibility: visible !important; }
    `,
  });
  try {
    await node.screenshot({
      path: `${prefix}-chrome.png`,
      omitBackground: true,
      animations: 'disabled',
    });
  } finally {
    await backdrop.evaluate(el => el.parentNode?.removeChild(el));
  }
  execFileSync(process.execPath, [
    resolve('packages/cli/dist/bin.js'),
    resolve(out, 'index.tsx'),
    '--preset',
    `${prefix}-preset.json`,
    ...(scale === 1 ? [] : ['--scale', String(scale)]),
    '-o',
    `${prefix}-cli.png`,
  ]);
  const percent = await diffPng(
    `${prefix}-chrome.png`,
    `${prefix}-cli.png`,
    `${prefix}-diff.png`,
  );
  const {width, height} = PNG.sync.read(await readFile(`${prefix}-chrome.png`));
  rows.push({lane, scale, dpr, width, height, percent});
  await writeFile(
    resolve(out, 'parity.json'),
    JSON.stringify(rows, null, 2) + '\n',
  );
  console.log(rows.at(-1));
  assert.ok(
    percent <= MAX_DIFF_PERCENT,
    `Inspect ${prefix}-diff.png before continuing`,
  );
}

await mkdir(out, {recursive: true});
await writeFile(resolve(out, 'index.tsx'), code);
for (const scale of [1, 2]) {
  const browser = await launchChrome(scale);
  const page = await browser.newPage({
    viewport: null,
    permissions: ['clipboard-read', 'clipboard-write'],
  });
  page.setDefaultTimeout(120_000);
  page.on('pageerror', error => console.error(error.message));
  try {
    console.log(`Opening ${values.url} at scale ${scale}`);
    await page.goto(values.url, {waitUntil: 'commit'});
    const editor = page.locator('.cm-content[contenteditable="true"]');
    await editor.waitFor({state: 'attached', timeout: 600_000});
    console.log('Editor ready');
    const close = page.getByRole('button', {name: 'close', exact: true});
    if (await close.isVisible()) await close.click();
    await editor.fill(code);
    await page.addStyleTag({
      content: `
      [class*="Frame_previewPortal"] { opacity: 1 !important; z-index: 9999 !important; pointer-events: none !important; }
      [class*="Frame_previewPortal"]::after { display: none !important; }
      [class*="Frame_previewWrapper"] [data-export-exclude="true"] { display: none !important; }
    `,
    });
    await selectTheme(page, 'Dracula');
    await compare(page, 1, scale);
    await selectTheme(page, 'GitHub Dark');
    await compare(page, 5, scale);
  } catch (error) {
    await page.screenshot({path: resolve(out, `web-error-${scale}x.png`)});
    await writeFile(
      resolve(out, `web-error-${scale}x.txt`),
      await page.locator('body').innerText(),
    );
    throw error;
  } finally {
    await browser.close();
  }
}
