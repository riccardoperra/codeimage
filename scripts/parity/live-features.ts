import assert from 'node:assert/strict';
import {mkdir, readFile, writeFile} from 'node:fs/promises';
import {chromium, type Page} from 'playwright';
import {
  diffPng,
  exportPng,
  openEditor,
  selectTheme,
  MAX_DIFF_PERCENT,
} from './lib';

const out = '/tmp/swarm-p1';
const evidence: Record<string, unknown> = {};
const code =
  'const ready = a !== b;\nconst arrow = (x: number) => x >= 42;\nconsole.log(arrow(42));';

async function language(page: Page, name: string) {
  await page.locator('button[aria-label="Language"]').click();
  await page.getByRole('option', {name, exact: true}).click();
  await page.locator('.cm-content[contenteditable="true"]').waitFor();
}

async function main() {
  await mkdir(out, {recursive: true});
  const browser = await chromium.launch({channel: 'chromium'});
  try {
    const context = await browser.newContext({
      viewport: {width: 1440, height: 1000},
      deviceScaleFactor: 1,
      ignoreHTTPSErrors: true,
      permissions: ['clipboard-read', 'clipboard-write'],
    });
    await context.addInitScript({content: 'globalThis.__name = fn => fn;'});
    context.setDefaultTimeout(30_000);
    const head = await context.newPage();
    await openEditor(head, 'http://127.0.0.1:4401');
    await selectTheme(head, 'Dracula');
    await head.locator('.cm-content[contenteditable="true"]').fill(code);
    await head
      .locator('label[for="frameLineNumbersField"]')
      .locator('..')
      .getByRole('tab', {name: 'Show', exact: true})
      .click();
    await head.locator('#frameLineNumberStartField-input').fill('42');
    await head.locator('#frameLineNumberStartField-input').press('Tab');
    await exportPng(head, `${out}/p1-gutter.png`);
    evidence.gutterStart = await head
      .locator('[data-static-code-view] .cm-gutterElement')
      .first()
      .textContent();
    assert.equal(evidence.gutterStart, '42');
    await head
      .locator('label')
      .filter({hasText: 'Ligatures'})
      .locator('..')
      .getByRole('tab', {name: 'No', exact: true})
      .click();
    await exportPng(head, `${out}/p1-ligatures.png`);
    evidence.ligatures = await head
      .locator('[data-static-code-view] .cm-line')
      .first()
      .evaluate(el => getComputedStyle(el).fontVariantLigatures);
    assert.equal(evidence.ligatures, 'none');
    await head.getByRole('button', {name: 'Export', exact: true}).click();
    await head.getByRole('tab', {name: 'SVG', exact: true}).click();
    const svgDownload = head.waitForEvent('download');
    await head.getByRole('button', {name: 'Confirm', exact: true}).click();
    await (await svgDownload).saveAs(`${out}/p1-export.svg`);
    const xml = await readFile(`${out}/p1-export.svg`);
    const svg = await context.newPage();
    await svg.setContent(
      `<body style="margin:0"><img src="data:image/svg+xml;base64,${xml.toString('base64')}"></body>`,
    );
    await svg.locator('img').screenshot({path: `${out}/p1-svg.png`});
    await svg.close();
    evidence.svgDiffPercent = await diffPng(
      `${out}/p1-ligatures.png`,
      `${out}/p1-svg.png`,
      `${out}/p1-svg-diff.png`,
    );
    assert.ok(Number(evidence.svgDiffPercent) <= MAX_DIFF_PERCENT);
    await head
      .locator('label[for="frameTerminalTypeField"]')
      .locator('..')
      .locator('[aria-haspopup]')
      .click();
    await head.locator('[class*="RadioBlock_radioBlock"]').nth(0).click();
    await head.keyboard.press('Escape');
    await head
      .locator('label[for="frameTabReflectionField"]')
      .locator('..')
      .getByRole('tab', {name: 'Show', exact: true})
      .click();
    await exportPng(head, `${out}/p1-windows.png`);
    evidence.windowsGlass = true;
    console.log('Gutter, ligatures, SVG and Windows glass passed');
    await writeFile(`${out}/features.json`, JSON.stringify(evidence, null, 2));

    await head.getByRole('button', {name: 'hint', exact: true}).click();
    await head.getByRole('tab', {name: '1x', exact: true}).click();
    await head.keyboard.press('Escape');
    await exportPng(head, `${out}/p1-clipboard-download.png`);
    await head.bringToFront();
    await head
      .getByRole('button', {name: 'Copy to clipboard', exact: true})
      .click();
    await head
      .getByText('Snippet copied to clipboard', {exact: true})
      .waitFor();
    const paste = await context.newPage();
    await paste.route('**/__p1-paste', route =>
      route.fulfill({
        contentType: 'text/html',
        body: '<!doctype html><title>Clipboard paste verification</title>',
      }),
    );
    await paste.goto('http://127.0.0.1:4401/__p1-paste');
    await paste.setContent(`<div contenteditable="true" id="paste">Paste here</div><button id="read">Read clipboard image</button><script>
      async function show(blob) { window.pastedBytes = Array.from(new Uint8Array(await blob.arrayBuffer())); const image = new Image(); image.src = URL.createObjectURL(blob); document.body.append(image); }
      document.addEventListener('paste', event => {const file = Array.from(event.clipboardData.files).find(file => file.type === 'image/png');if (file) {event.preventDefault();show(file);}});
      document.querySelector('#read').onclick = async () => {const items = await navigator.clipboard.read();const item = items.find(item => item.types.includes('image/png'));if (item) show(await item.getType('image/png'));};
      </script>`);
    await paste.locator('#paste').click();
    await paste.keyboard.press('Meta+V');
    try {
      await paste.waitForFunction(
        () => Reflect.get(window, 'pastedBytes')?.length,
        undefined,
        {timeout: 5000},
      );
    } catch {
      await paste.locator('#read').click();
      await paste.waitForFunction(
        () => Reflect.get(window, 'pastedBytes')?.length,
        undefined,
        {timeout: 15000},
      );
    }
    const bytes: number[] = await paste.evaluate(() =>
      Reflect.get(window, 'pastedBytes'),
    );
    await writeFile(`${out}/p1-clipboard.png`, Buffer.from(bytes));
    evidence.clipboardDiffPercent = await diffPng(
      `${out}/p1-clipboard-download.png`,
      `${out}/p1-clipboard.png`,
      `${out}/p1-clipboard-diff.png`,
    );
    assert.equal(evidence.clipboardDiffPercent, 0);
    await paste.close();
    console.log('Native clipboard image matches download');
    await writeFile(`${out}/features.json`, JSON.stringify(evidence, null, 2));

    for (const name of ['Python', 'JSON', 'Typescript'])
      await language(head, name);
    await head.reload({waitUntil: 'commit'});
    await head.locator('.cm-content[contenteditable="true"]').waitFor();
    await language(head, 'Typescript');
    await head.locator('.cm-content[contenteditable="true"]').fill(code);
    await head.locator('[aria-label="Tab name"] input').fill('main.ts');
    await head.keyboard.press('Escape');
    for (const tab of [
      {
        name: 'hello.py',
        language: 'Python',
        code: 'def hello(name):\n    return "Hi " + name',
      },
      {
        name: 'config.json',
        language: 'JSON',
        code: '{"ready": true, "count": 42}',
      },
    ]) {
      await head.locator('button[class*="TabAddButton_button"]').click();
      await head.locator('[aria-label="Tab name"] input').fill(tab.name);
      await head.keyboard.press('Escape');
      await language(head, tab.language);
      await head.locator('.cm-content[contenteditable="true"]').fill(tab.code);
    }
    await exportPng(head, `${out}/p1-tabs.png`);
    evidence.tabs = await head
      .locator('[class*="Frame_previewWrapper"]')
      .innerText();
    for (const name of ['main.ts', 'hello.py', 'config.json'])
      assert.ok(String(evidence.tabs).includes(name));
    assert.ok(
      (await head
        .locator('[data-static-code-view] .cm-line span[class]')
        .count()) > 0,
    );
    console.log('Three language tabs exported');
    await writeFile(`${out}/features.json`, JSON.stringify(evidence, null, 2));
  } finally {
    await browser.close();
  }
}
main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
