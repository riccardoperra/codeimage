#!/usr/bin/env node
import assert from 'node:assert/strict';
import {spawn, execFileSync} from 'node:child_process';
import {createServer} from 'node:net';
import {createRequire} from 'node:module';
import {mkdir, writeFile, readFile, mkdtemp, cp, rm} from 'node:fs/promises';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';
import {createMockContext} from './mock-context.mjs';
import {PNG} from 'pngjs';
import {dismissNews} from './news.mjs';
const root = fileURLToPath(new URL('../../../..', import.meta.url));
process.chdir(root);
const require = createRequire(import.meta.url);
const out = resolve(
  process.env.ARTIFACT_DIR ?? `/tmp/codeimage-verification-${Date.now()}`,
);
const port = Number(process.env.VERIFY_PORT ?? 4437);
assert.ok(
  !process.env.VERIFY_CASES || process.env.VERIFY_AUDIT === '1',
  'VERIFY_CASES requires VERIFY_AUDIT=1',
);
await mkdir(out, {recursive: true});
console.log(`Evidence: ${out}`);
// Fail before launching if another instance owns this port.
await new Promise((ok, fail) => {
  const probe = createServer();
  probe.once('error', fail);
  probe.listen(port, '127.0.0.1', () => probe.close(ok));
});
const scratch = await mkdtemp('/tmp/codeimage-verify-public-');
try {
  await cp(resolve(root, 'apps/codeimage/public'), scratch, {recursive: true});
  await cp(
    require.resolve('msw/mockServiceWorker.js', {
      paths: [resolve(root, 'apps/codeimage')],
    }),
    resolve(scratch, 'mockServiceWorker.js'),
  );
} catch (error) {
  await rm(scratch, {recursive: true, force: true});
  throw error;
}
const log = [];
const server = spawn(
  process.execPath,
  [
    '--input-type=module',
    '-e',
    `import {createServer} from 'vite'; const server = await createServer({cacheDir:process.env.VERIFY_PUBLIC+'-cache',publicDir:process.env.VERIFY_PUBLIC, server:{host:'127.0.0.1',port:Number(process.env.VERIFY_PORT),strictPort:true}}); await server.listen();`,
  ],
  {
    cwd: resolve(root, 'apps/codeimage'),
    stdio: ['ignore', 'pipe', 'pipe'],
    env: {
      ...process.env,
      VERIFY_PUBLIC: scratch,
      VERIFY_PORT: String(port),
      VITE_ENABLE_MSW: 'true',
      VITE_MOCK_AUTH: 'true',
      VITE_API_BASE_URL: '',
      VITE_PRESET_LIMIT: '10',
      VITE_PRESET_LIMIT_GUEST: '5',
    },
  },
);
server.stdout.on('data', b => log.push(String(b)));
server.stderr.on('data', b => log.push(String(b)));
let browser, context;
const errors = [];
const actions = [];
const base = `http://127.0.0.1:${port}`;
try {
  let ready = false;
  for (let i = 0; i < 120; i++) {
    if (server.exitCode !== null)
      throw new Error(`Vite exited: ${log.join('')}`);
    try {
      if ((await fetch(base)).ok) {
        ready = true;
        break;
      }
    } catch {
      // The owned server may still be binding its socket.
    }
    await new Promise(r => setTimeout(r, 500));
  }
  assert.ok(ready, 'Vite HTTP readiness');
  browser =
    process.env.VERIFY_BROWSER_CHANNEL === 'chrome'
      ? (
          await chromium.launchPersistentContext(`${scratch}-chrome`, {
            channel: 'chrome',
            args: process.env.VERIFY_CHROME_PORT
              ? [`--remote-debugging-port=${process.env.VERIFY_CHROME_PORT}`]
              : [],
          })
        ).browser()
      : await chromium.launch({
          channel: process.env.VERIFY_BROWSER_CHANNEL || undefined,
        });
  assert.ok(browser, 'owned browser launched');
  context = await createMockContext(browser, base, {
    viewport: {width: 1440, height: 1000},
    locale: 'en-US',
    hasTouch: process.env.VERIFY_TOUCH === '1',
  });
  await context.tracing.start({
    screenshots: true,
    snapshots: true,
    sources: true,
  });
  const page = await context.newPage();
  page.setDefaultTimeout(120000);
  page.on('pageerror', e => errors.push(String(e)));
  page.on('console', m => log.push(`[browser ${m.type()}] ${m.text()}\n`));
  await page.goto(base);
  const editor = page.locator('.cm-content[contenteditable="true"]').first();
  await editor.waitFor();
  await dismissNews(page);
  await page.evaluate(() => document.fonts.ready);
  await writeFile(
    resolve(out, 'doctor.json'),
    JSON.stringify(
      {
        pid: server.pid,
        publicDir: scratch,
        cacheDir: `${scratch}-cache`,
        base,
        head: execFileSync('git', ['rev-parse', 'HEAD'], {
          encoding: 'utf8',
        }).trim(),
        editorVisible: await editor.isVisible(),
        browserVersion: browser.version(),
        chromeProfile:
          process.env.VERIFY_BROWSER_CHANNEL === 'chrome'
            ? `${scratch}-chrome`
            : undefined,
        chromeDebugPort: process.env.VERIFY_CHROME_PORT,
        browserChannel: process.env.VERIFY_BROWSER_CHANNEL || 'chromium',
        msw: log.some(s => s.includes('Mocking enabled')),
        version: log.find(s => s.includes('CodeImage version')),
      },
      null,
      2,
    ),
  );
  assert.ok(
    log.some(s => s.includes('Mocking enabled')),
    'MSW boundary active',
  );
  actions.push(
    'Doctor: owned Vite process, HTTP ready, fresh guest context, MSW active, editor visible',
  );
  await page.screenshot({path: resolve(out, 'before.png'), fullPage: true});
  const code =
    'const verification = "CodeImage user journey";\nconsole.log(verification);';
  await editor.fill(code);
  await page.waitForFunction(
    code =>
      document.querySelector('.cm-content[contenteditable="true"]')
        ?.innerText === code,
    code,
  );
  assert.equal(await editor.innerText(), code);
  actions.push(
    'Filled visible CodeMirror editor and asserted exact two-line text',
  );
  await page.screenshot({
    path: resolve(out, 'export-settings.png'),
    fullPage: true,
  });
  const [download] = await Promise.all([
    page.waitForEvent('download', {timeout: 120000}),
    page.locator('[data-export-image]').click(),
  ]);
  await download.saveAs(resolve(out, 'snippet.png'));
  const png = PNG.sync.read(await readFile(resolve(out, 'snippet.png')));
  assert.ok(png.width > 0 && png.height > 0);
  assert.ok(new Set(png.data).size > 10, 'image has varied pixel content');
  actions.push(
    `Confirmed PNG export; decoded actual download ${png.width}x${png.height}`,
  );
  await page.screenshot({path: resolve(out, 'after.png'), fullPage: true});
  if (process.env.VERIFY_AUDIT === '1') {
    const {audit} = await import('./audit.mjs');
    await audit({page, context, base, out, server});
  }
  assert.deepEqual(errors, [], 'No uncaught browser errors');
  await writeFile(
    resolve(out, 'result.json'),
    JSON.stringify(
      {status: 'passed', actions, width: png.width, height: png.height},
      null,
      2,
    ),
  );
  console.log('PASS editor → PNG download');
} catch (error) {
  await writeFile(
    resolve(out, 'result.json'),
    JSON.stringify(
      {status: 'failed', actions, error: String(error), errors},
      null,
      2,
    ),
  );
  throw error;
} finally {
  if (context)
    await context.tracing
      .stop({path: resolve(out, 'trace.zip')})
      .catch(() => {});
  if (browser) await browser.close();
  if (server.exitCode === null) {
    server.kill('SIGTERM');
    await new Promise(r => {
      server.once('exit', r);
      setTimeout(() => {
        if (server.exitCode === null) server.kill('SIGKILL');
        r();
      }, 5000).unref();
    });
  }
  await rm(scratch, {recursive: true, force: true});
  await rm(`${scratch}-cache`, {recursive: true, force: true});
  await rm(`${scratch}-chrome`, {recursive: true, force: true});
  await writeFile(resolve(out, 'run.log'), log.join(''));
  assert.ok(
    (await readFile(resolve(out, 'result.json'))).length,
    'evidence survives cleanup',
  );
  console.log(`Cleaned up owned instance; evidence retained: ${out}`);
}
