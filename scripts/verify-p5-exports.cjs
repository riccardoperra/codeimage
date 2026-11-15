const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {chromium} = require(
  process.env.P5_TOOLS_ROOT
    ? path.join(process.env.P5_TOOLS_ROOT, 'playwright')
    : 'playwright',
);

const out = process.env.P5_OUT ?? '/tmp/swarm-p5';
fs.mkdirSync(out, {recursive: true});

async function open(browser, url, head) {
  process.stdout.write(`Opening ${url}\n`);
  const page = await browser.newPage({viewport: {width: 1440, height: 1000}});
  if (process.env.P5_WORKER_PATH)
    await page.route('**/mockServiceWorker.js', route =>
      route.fulfill({
        path: process.env.P5_WORKER_PATH,
        contentType: 'text/javascript',
      }),
    );
  page.setDefaultTimeout(120000);
  await page.addInitScript(() =>
    performance.setResourceTimingBufferSize(10000),
  );
  await page.goto(url, {waitUntil: 'domcontentloaded'});
  await page.locator('[contenteditable=true]').first().waitFor();
  process.stdout.write(`Editor ready ${url}\n`);
  const close = page.locator('button[aria-label=close]');
  if (await close.count()) {
    await close.click();
    await page.getByRole('dialog').waitFor({state: 'hidden'});
  }
  await page.evaluate(async head => {
    const {getRootEditorStore} = await import('/src/state/editor/index.ts');
    window.p5View = getRootEditorStore().activeEditorView();
    window.p5ExportImage = await import('/src/hooks/use-export-image.ts');
    if (head)
      window.p5Marks =
        await import('/src/components/CustomEditor/plugins/lineMarks/state.ts');
  }, head);
  await page.waitForFunction(() =>
    document.querySelector('[data-static-code-view]'),
  );
  const fonts = await page.evaluate(async () => {
    const style = getComputedStyle(
      window.p5View.contentDOM.querySelector('.cm-line'),
    );
    const font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
    const faces = await document.fonts.load(font);
    return {
      font,
      faces: faces.map(face => ({family: face.family, status: face.status})),
    };
  });
  process.stdout.write(`${JSON.stringify(fonts)}\n`);
  fs.writeFileSync(
    path.join(out, head ? 'perf-head-font.json' : 'perf-trunk-font.json'),
    JSON.stringify(fonts, null, 2),
  );
  const code = Array.from(
    {length: 300},
    (_, i) => `const line${i + 1} = ${i + 1};`,
  ).join('\n');
  await page.evaluate(
    code =>
      window.p5View.dispatch({
        changes: {from: 0, to: window.p5View.state.doc.length, insert: code},
      }),
    code,
  );
  await page.waitForFunction(
    () =>
      document.querySelectorAll('[data-static-code-view] .cm-line').length ===
      300,
  );
  return page;
}

async function marks(page, count) {
  await page.evaluate(
    count =>
      window.p5Marks.setLineMarks(
        window.p5View,
        {
          lines: Array.from({length: count}, (_, i) => ({
            line: 1 + i * 3,
            kind: ['added', 'removed', 'highlight'][i % 3],
          })),
          focusedLines: [],
        },
        false,
      ),
    count,
  );
}

async function measure(page) {
  return page.evaluate(async () => {
    const root = document.querySelector('[data-static-code-view]');
    const render = window.p5ExportImage.exportImage;
    performance.mark('p5-export-start');
    const start = performance.now();
    const pending = render({
      renderer: 'dom-export',
      ref: root.closest('[class*=previewWrapper]'),
      options: {extension: 'png', mode: 'getBlob', pixelRatio: 1, quality: 1},
    });
    const renderedLines = root.querySelectorAll('.cm-line').length;
    const renderedMarks = root.querySelectorAll('[data-mark]').length;
    const lastLine = root.querySelector('.cm-line:last-child')?.textContent;
    const blob = await pending;
    const ms = performance.now() - start;
    performance.mark('p5-export-ready');
    performance.measure('p5-export', 'p5-export-start', 'p5-export-ready');
    const bitmap = await createImageBitmap(blob);
    const result = {
      ms,
      bytes: blob.size,
      width: bitmap.width,
      height: bitmap.height,
      renderedLines,
      renderedMarks,
      lastLine,
    };
    bitmap.close();
    return result;
  });
}

async function main() {
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.P5_CHROMIUM,
    args: ['--force-device-scale-factor=1'],
  });
  try {
    const trunk = await open(
      browser,
      process.env.P5_TRUNK_URL ?? 'http://localhost:4426',
      false,
    );
    const head = await open(
      browser,
      process.env.P5_HEAD_URL ?? 'http://localhost:4428',
      true,
    );
    await marks(head, 0);
    if (process.env.P5_SETUP_ONLY === '1') {
      await marks(head, 100);
      await head.waitForFunction(
        () =>
          document.querySelectorAll('[data-static-code-view] [data-mark]')
            .length === 100,
      );
      process.stdout.write(
        'Setup passed: two 300-line static previews and 100 head marks\n',
      );
      return;
    }
    await measure(trunk);
    await measure(head);
    await marks(head, 100);
    if (process.env.P5_PROFILE_PATH) {
      const session = await head.context().newCDPSession(head);
      await session.send('Profiler.enable');
      await session.send('Profiler.start');
      await measure(head);
      const {profile} = await session.send('Profiler.stop');
      fs.writeFileSync(process.env.P5_PROFILE_PATH, JSON.stringify(profile));
      await session.detach();
    }
    await measure(head);
    const rows = [];
    for (let run = 1; run <= 10; run++) {
      const order =
        run % 2
          ? ['trunk', 'head-plain', 'head-marks']
          : ['head-marks', 'head-plain', 'trunk'];
      for (const side of order) {
        const page = side === 'trunk' ? trunk : head;
        if (side !== 'trunk')
          await marks(page, side === 'head-marks' ? 100 : 0);
        const result = await measure(page);
        assert.equal(result.renderedLines, 300);
        assert.equal(result.renderedMarks, side === 'head-marks' ? 100 : 0);
        assert.equal(result.lastLine, 'const line300 = 300;');
        assert(result.height > 4000 && result.bytes > 10000);
        rows.push({run, side, ...result});
        fs.writeFileSync(
          path.join(out, 'perf-runs.json'),
          JSON.stringify(rows, null, 2),
        );
        process.stdout.write(`${side} ${run} ${result.ms.toFixed(1)} ms\n`);
      }
    }
    const summary = {};
    for (const side of ['trunk', 'head-plain', 'head-marks']) {
      const values = rows
        .filter(row => row.side === side)
        .map(row => row.ms)
        .sort((a, b) => a - b);
      summary[side] = {
        n: values.length,
        median: (values[4] + values[5]) / 2,
        min: values[0],
        max: values[9],
      };
    }
    summary.ratio = summary['head-marks'].median / summary.trunk.median;
    fs.writeFileSync(
      path.join(out, 'perf-summary.json'),
      JSON.stringify(summary, null, 2),
    );
    process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
    assert(
      summary.ratio <= 1.1,
      'Marked export exceeds the P5 performance limit',
    );
  } finally {
    await browser.close();
  }
}

main().catch(error => {
  process.stderr.write(`${error.stack}\n`);
  process.exitCode = 1;
});
