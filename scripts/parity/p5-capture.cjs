const {chromium} = require('playwright');
const fs = require('node:fs');
const assert = require('node:assert/strict');
const path = require('node:path');
const executablePath =
  process.env.P5_CHROMIUM ??
  process.env.HOME +
    '/Library/Caches/ms-playwright/chromium-1200/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing';
const themes = [
  'Fleet Dark',
  'VSCode Dark',
  'XCode Dark',
  'Night Owl',
  'Material Light',
];
const code =
  'const before = 1; // [!code --]\nconst after = 2; // [!code ++]\n\nfunction greet(name: string) { // [!code focus:2]\n  return `Hello ${name}`;\n}\nconsole.log(greet("CodeImage"));';
async function main() {
  const phase = process.argv[2],
    url = process.argv[3] || 'http://localhost:4427';
  const out = path.join(process.env.P5_OUT ?? '/tmp/p5-stack', phase);
  fs.mkdirSync(out, {recursive: true});
  const browser = await chromium.launch({
    executablePath,
    headless: true,
    args: ['--force-device-scale-factor=1'],
  });
  try {
    const context = await browser.newContext({
      viewport: {width: 1440, height: 1000},
    });
    if (process.env.P5_WORKER_PATH)
      await context.route('**/mockServiceWorker.js', r =>
        r.fulfill({
          path: process.env.P5_WORKER_PATH,
          contentType: 'text/javascript',
        }),
      );
    const page = await context.newPage();
    page.setDefaultTimeout(300000);
    page.on('pageerror', e => console.log('PAGEERROR', e.message));
    page.on('console', m => {
      if (m.type() === 'error') console.log('CONSOLE', m.text().slice(0, 400));
    });
    console.log('opening', url);
    await page.goto(url, {waitUntil: 'domcontentloaded', timeout: 180000});
    const editor = page.locator('[contenteditable=true]').first();
    await editor.waitFor();
    console.log('editor ready');
    const close = page.getByRole('button', {name: 'close', exact: true});
    if (await close.isVisible()) await close.click();
    async function exp(name) {
      console.log('exporting', name);
      await page.evaluate(async () => {
        const s = getComputedStyle(
          document.querySelector('[contenteditable=true] .cm-line'),
        );
        await document.fonts.load(
          `${s.fontWeight} ${s.fontSize} ${s.fontFamily}`,
        );
        await document.fonts.ready;
      });
      await page.getByRole('button', {name: 'Export', exact: true}).click();
      await page.getByRole('tab', {name: 'PNG', exact: true}).click();
      const download = page.waitForEvent('download');
      await page.getByRole('button', {name: 'Confirm', exact: true}).click();
      await (await download).saveAs(path.join(out, name + '.png'));
    }
    await exp('no-marks');
    if (phase === 'trunk') return;
    await editor.click();
    await page.keyboard.press('Meta+a');
    await editor.evaluate((el, code) => {
      const data = new DataTransfer();
      data.setData('text/plain', code);
      el.dispatchEvent(
        new ClipboardEvent('paste', {
          clipboardData: data,
          bubbles: true,
          cancelable: true,
        }),
      );
    }, code);
    await page.getByRole('button', {name: 'Undo', exact: true}).waitFor();
    await page
      .locator('label[for="frameLineNumbersField"]')
      .locator('..')
      .getByText('Show', {exact: true})
      .click();
    const rows = [];
    for (const theme of themes) {
      await page.locator('button[aria-label="Syntax highlight"]').click();
      await page.getByRole('option', {name: theme, exact: true}).click();
      await page.waitForTimeout(500);
      await exp(theme.toLowerCase().replaceAll(' ', '-'));
      const row = await page.evaluate(() => {
        const root =
          document.querySelector('[data-static-code-view]') ||
          [...document.querySelectorAll('[data-line-marks]')].find(
            e =>
              !e.querySelector('[contenteditable=true]') &&
              e.querySelector('.cm-line'),
          );
        return {
          focus: root?.dataset.lineFocus,
          marks: [...root.querySelectorAll('[data-mark]')].map(e => ({
            kind: e.dataset.mark,
            text: e.textContent,
          })),
          dimmed: [...root.querySelectorAll('.cm-lineMarkDim')].map(
            e => e.textContent,
          ),
        };
      });
      assert.equal(row.focus, 'true');
      assert.equal(row.marks.length, 4);
      assert.equal(row.dimmed.length, 5);
      rows.push({theme, ...row});
      console.log(phase, theme, 'exported');
    }
    fs.writeFileSync(
      path.join(out, 'contract.json'),
      JSON.stringify(rows, null, 2),
    );
  } finally {
    await browser.close();
  }
}
main().catch(e => {
  console.error(e);
  process.exitCode = 1;
});
