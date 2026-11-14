import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import {chromium} from 'playwright';
import {openEditor} from './lib';

async function main() {
  const browser = await chromium.launch();
  try {
    const context = await browser.newContext({
      viewport: {width: 1440, height: 1000},
      ignoreHTTPSErrors: true,
    });
    await context.addInitScript({content: 'globalThis.__name = fn => fn;'});
    const page = await context.newPage();
    await openEditor(page, 'http://127.0.0.1:4401');
    const session = await context.newCDPSession(page);
    await session.send('Tracing.start', {
      categories: 'devtools.timeline,blink.user_timing',
      transferMode: 'ReturnAsStream',
    });
    await page.evaluate(() =>
      Reflect.set(
        window,
        '__p1Root',
        document.querySelector('[data-static-code-view]'),
      ),
    );
    await page
      .locator('.cm-content[contenteditable="true"]')
      .fill('const value = 1;');
    await page
      .locator('.cm-content[contenteditable="true"]')
      .press('ControlOrMeta+End');
    await page.keyboard.type(' '.repeat(50), {delay: 25});
    await page.getByRole('button', {name: 'Export', exact: true}).focus();
    await page.evaluate(() => performance.mark('p1-typing-ended'));
    await page.waitForTimeout(10_000);
    const completed = new Promise<string>((resolve, reject) =>
      session.once('Tracing.tracingComplete', event => {
        if (event.stream) resolve(event.stream);
        else reject(new Error('Chromium did not return a trace stream'));
      }),
    );
    await session.send('Tracing.end');
    const stream = await completed;
    let trace = '';
    while (true) {
      const chunk = await session.send('IO.read', {handle: stream});
      trace += chunk.base64Encoded
        ? Buffer.from(chunk.data, 'base64').toString()
        : chunk.data;
      if (chunk.eof) break;
    }
    await session.send('IO.close', {handle: stream});
    await writeFile('/tmp/swarm-p1/p1-idle-trace.json', trace);
    const events: {
      name: string;
      args?: {data?: {timerId?: number; singleShot?: boolean}};
    }[] = JSON.parse(trace).traceEvents;
    const intervals = new Set<number>();
    for (const event of events) {
      const timerId = event.args?.data?.timerId;
      if (timerId === undefined) continue;
      if (
        event.name === 'TimerInstall' &&
        event.args?.data?.singleShot === false
      )
        intervals.add(timerId);
      if (event.name === 'TimerRemove') intervals.delete(timerId);
    }
    const sameRoot = await page.evaluate(
      () =>
        document.querySelector('[data-static-code-view]') ===
        Reflect.get(window, '__p1Root'),
    );
    const result = {
      keystrokes: 50,
      idleSeconds: 10,
      newRecurringIntervalsLeft: intervals.size,
      sameExportNode: sameRoot,
    };
    await writeFile(
      '/tmp/swarm-p1/p1-idle.json',
      JSON.stringify(result, null, 2),
    );
    await page.screenshot({path: '/tmp/swarm-p1/p1-idle.png'});
    assert.ok(sameRoot);
    assert.equal(intervals.size, 0);
    console.log(result);
  } finally {
    await browser.close();
  }
}
main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
