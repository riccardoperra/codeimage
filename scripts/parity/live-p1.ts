import assert from 'node:assert/strict';
import {mkdir, writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {chromium, type Page} from 'playwright';
import {diffPng, exportPng, openEditor, selectTheme} from './lib';

const out = '/tmp/swarm-p1/live';
const longCode = Array.from(
  {length: 300},
  (_, n) => `const line${n + 1}: number = ${n + 1};`,
).join('\n');
const result: Record<string, unknown> = {};

async function setCode(page: Page, code: string) {
  const editor = page.locator('.cm-content[contenteditable="true"]');
  await editor.fill(code);
  await page.waitForTimeout(500);
}

async function shot(page: Page, name: string) {
  await page.screenshot({path: join(out, name), fullPage: true});
}

async function main() {
  await mkdir(out, {recursive: true});
  const browser = await chromium.launch();
  try {
    const context = await browser.newContext({
      viewport: {width: 1440, height: 1000},
      deviceScaleFactor: 1,
      ignoreHTTPSErrors: true,
      permissions: ['clipboard-read', 'clipboard-write'],
    });
    await context.addInitScript({content: 'globalThis.__name = fn => fn;'});
    await context.addInitScript(() => {
      const browserWindow: Window = window;
      const active = new Set<number>();
      const set = browserWindow.setInterval.bind(browserWindow);
      const clear = browserWindow.clearInterval.bind(browserWindow);
      let callbacks = 0;
      browserWindow.setInterval = (
        handler: TimerHandler,
        timeout?: number,
        ...args: unknown[]
      ) => {
        const id = set(
          typeof handler === 'function'
            ? (...values: unknown[]) => {
                callbacks++;
                handler.apply(browserWindow, values);
              }
            : handler,
          timeout,
          ...args,
        );
        active.add(id);
        return id;
      };
      browserWindow.clearInterval = id => {
        active.delete(id ?? -1);
        clear(id);
      };
      Object.defineProperty(window, '__p1Timers', {
        get: () => ({active: active.size, callbacks}),
      });
    });
    context.setDefaultTimeout(120_000);
    const base = await context.newPage();
    const head = await context.newPage();
    await openEditor(base, 'http://127.0.0.1:4412');
    await openEditor(head, 'http://127.0.0.1:4401');
    for (const page of [base, head]) await selectTheme(page, 'Dracula');
    await exportPng(base, join(out, 'p1-default-base.png'));
    await exportPng(head, join(out, 'p1-default.png'));
    result.defaultDiffPercent = await diffPng(
      join(out, 'p1-default-base.png'),
      join(out, 'p1-default.png'),
      join(out, 'p1-default-diff.png'),
    );
    assert.ok(Number(result.defaultDiffPercent) <= 0.5);
    for (const page of [base, head]) await setCode(page, longCode);
    const longBase = await exportPng(base, join(out, 'p1-long-base.png'));
    const longHead = await exportPng(head, join(out, 'p1-long.png'));
    console.log('Exported 300-line PNGs');
    result.longImage = {width: longHead.width, height: longHead.height};
    result.longDiffPercent = await diffPng(
      join(out, 'p1-long-base.png'),
      join(out, 'p1-long.png'),
      join(out, 'p1-long-diff.png'),
    );
    assert.equal(
      await head.locator('[data-static-code-view] .cm-line').count(),
      300,
    );
    assert.ok(
      (await head
        .locator('[data-static-code-view] .cm-line')
        .last()
        .textContent()) === 'const line300: number = 300;',
    );
    assert.equal(longBase.height, longHead.height);
    assert.ok(Number(result.longDiffPercent) <= 0.5);
    const times: {base: number[]; head: number[]} = {base: [], head: []};
    for (let i = 0; i < 11; i++) {
      for (const [label, page] of [
        ['base', base],
        ['head', head],
      ] as const) {
        await page.getByRole('button', {name: 'Export', exact: true}).click();
        await page.evaluate(() => {
          performance.clearMarks('p1-export-start');
          performance.clearMarks('p1-blob-ready');
          const createObjectURL = URL.createObjectURL;
          URL.createObjectURL = function (value) {
            const url = createObjectURL.call(this, value);
            if (value instanceof Blob && value.type === 'image/png') {
              performance.mark('p1-blob-ready');
              URL.createObjectURL = createObjectURL;
            }
            return url;
          };
          document.addEventListener(
            'click',
            event => {
              if (
                (event.target as HTMLElement)
                  .closest('button')
                  ?.textContent?.trim() === 'Confirm'
              )
                performance.mark('p1-export-start');
            },
            {capture: true, once: true},
          );
        });
        const download = page.waitForEvent('download', {timeout: 120_000});
        await page.getByRole('button', {name: 'Confirm', exact: true}).click();
        await (await download).saveAs(join(out, `perf-${label}-${i}.png`));
        const ms = await page.evaluate(
          () =>
            performance.measure('p1-export', 'p1-export-start', 'p1-blob-ready')
              .duration,
        );
        if (i) times[label].push(ms);
        console.log(`export ${label} ${i}: ${ms.toFixed(2)} ms`);
      }
    }
    result.perf = times;
    await writeFile(join(out, 'results.json'), JSON.stringify(result, null, 2));
    for (const [label, page] of [
      ['base', base],
      ['head', head],
    ] as const) {
      const before = await page.evaluate(() =>
        Reflect.get(window, '__p1Timers'),
      );
      await page.locator('.cm-content[contenteditable="true"]').press('End');
      await page.keyboard.type('x'.repeat(50), {delay: 25});
      const after = await page.evaluate(() =>
        Reflect.get(window, '__p1Timers'),
      );
      await page.waitForTimeout(10_000);
      const idle = await page.evaluate(() => Reflect.get(window, '__p1Timers'));
      result[`${label}Timers`] = {before, after, idle};
    }
    await shot(head, 'p1-idle.png');
    await writeFile(join(out, 'results.json'), JSON.stringify(result, null, 2));
  } finally {
    await browser.close();
  }
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
