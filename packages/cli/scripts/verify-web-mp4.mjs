// User-path web export and read-only retrieval of its saved project for CLI parity.
import assert from 'node:assert/strict';
import {spawn, execFileSync} from 'node:child_process';
import {mkdir, mkdtemp, readFile, writeFile, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';
import {PNG} from 'pngjs';
import pixelmatch from 'pixelmatch';
import {createMockContext} from '../../../.agents/skills/verify-codeimage/scripts/mock-context.mjs';
import {dismissNews} from '../../../.agents/skills/verify-codeimage/scripts/news.mjs';

const root = fileURLToPath(new URL('../../../', import.meta.url));
const base = process.argv[2] ?? 'http://127.0.0.1:4459';
const out = resolve(process.argv[3] ?? '/tmp/codeimage-a6-web-parity');
const ffmpeg = process.env.A6_FFMPEG ?? 'ffmpeg';
const ffprobe = process.env.A6_FFPROBE ?? 'ffprobe';
const scenario = process.env.A6_CASE ?? 'unequal';
assert.ok(['unequal', 'hidden', 'signature'].includes(scenario));
const requestedFps = Number(process.env.A6_FPS ?? 30);
await mkdir(out, {recursive: true});
const profile = await mkdtemp(join(tmpdir(), 'a6-parity-chrome-'));
const owner = await chromium.launchPersistentContext(profile, {
  channel: 'chrome',
  headless: true,
});
const browser = owner.browser();
assert.ok(browser);
const context = await createMockContext(browser, base, {
  viewport: {width: 1440, height: 1000},
  locale: 'en-US',
});
await context.tracing.start({
  screenshots: true,
  snapshots: true,
  sources: true,
});
const page = await context.newPage();
page.setDefaultTimeout(15_000);
const errors = [];
page.on('pageerror', error => errors.push(String(error)));
page.on('console', message => {
  if (message.type() === 'error') console.log('Browser:', message.text());
});
try {
  await page.goto(base, {waitUntil: 'domcontentloaded'});
  await page
    .locator('.cm-content[contenteditable="true"]')
    .first()
    .waitFor({timeout: 120_000});
  await dismissNews(page);
  await page.evaluate(() => document.fonts.ready);
  const section = page.locator('[data-section="window"] > button');
  if ((await section.getAttribute('aria-expanded')) !== 'true')
    await section.click();
  await page
    .locator('[data-control="window.style"]')
    .getByRole('button')
    .click();
  await page.getByRole('radio', {name: 'Editor', exact: true}).press('Space');
  await page
    .getByRole('dialog', {name: 'Window', exact: true})
    .getByRole('button', {name: 'Close', exact: true})
    .click();
  const strip = page
    .locator('[data-window-tabs]')
    .filter({has: page.getByRole('button', {name: 'Add tab', exact: true})})
    .first();
  const codes = [
    'let a = 1;',
    [
      ...Array.from({length: 11}, (_, i) => `const row${i} = ${i};`),
      'const lastLine = "BOTTOM_SENTINEL_WWWWWWWWWWWWW";',
    ].join('\n'),
  ];
  for (const [index, code] of codes.entries()) {
    if (index)
      await strip.getByRole('button', {name: 'Add tab', exact: true}).click();
    await page
      .locator('.cm-content[contenteditable="true"]')
      .first()
      .fill(code);
    await page.waitForFunction(
      code =>
        [
          ...document.querySelectorAll(
            '.cm-content[contenteditable="true"] .cm-line',
          ),
        ]
          .map(line => line.textContent)
          .join('\n') === code,
      code,
    );
  }
  const frame = page.locator('[data-section="frame"] > button');
  if ((await frame.getAttribute('aria-expanded')) !== 'true')
    await frame.click();
  if (scenario === 'hidden')
    await page
      .getByRole('switch', {name: 'Visible', exact: true})
      .press('Space');
  if (scenario === 'signature') {
    await page.locator('#signature-options').click();
    await page
      .getByPlaceholder('@handle or profile link', {exact: true})
      .fill('@step_size');
    await page.keyboard.press('Escape');
  }
  await page.locator('[data-animate-toggle]').click();
  await page.locator('[data-animate-panel]').waitFor();
  await page.locator('[data-export-menu]').click();
  const action = page.locator('[data-export-action="animation"]');
  if (await action.isVisible()) await action.click();
  const dialog = page.locator('[data-animation-export]');
  await dialog.waitFor();
  const scale = dialog.getByRole('button', {name: /^Scale/});
  if (await scale.count()) {
    await scale.click();
    await page.getByRole('option', {name: '1×', exact: true}).click();
  }
  await dialog.getByRole('button', {name: /^Frame rate/}).click();
  await page
    .getByRole('option', {name: `${requestedFps} fps`, exact: true})
    .click();
  assert.match(await dialog.innerText(), /Current frame/);
  await page.waitForFunction(
    () =>
      [...document.querySelectorAll('[data-animation-export] button')].some(
        button => button.textContent === 'Export MP4' && !button.disabled,
      ),
    undefined,
    {timeout: 120_000},
  );
  await page.screenshot({path: join(out, 'web-settings.png'), fullPage: true});
  const download = page.waitForEvent('download', {timeout: 180_000});
  await dialog.getByRole('button', {name: 'Export MP4', exact: true}).click();
  await (await download).saveAs(join(out, 'web.mp4'));
  await page.screenshot({path: join(out, 'web-export.png'), fullPage: true});
  let project;
  for (let attempt = 0; attempt < 50; attempt++) {
    project = await page.evaluate(
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
              db.close();
              resolve(read.result);
            };
            read.onerror = () => reject(read.error);
          };
        }),
    );
    if (
      project?.animation?.steps?.length === 2 &&
      project.editor.editors[1].code === codes[1]
    )
      break;
    await page.waitForTimeout(100);
  }
  assert.equal(project.animation.steps.length, 2);
  assert.equal(project.animation.fps, requestedFps);
  assert.deepEqual(
    project.editor.editors.map(editor => editor.code),
    codes,
  );
  assert.equal(project.frame.visible, scenario !== 'hidden');
  assert.equal(
    project.frame.signature?.handle ?? null,
    scenario === 'signature' ? '@step_size' : null,
  );
  assert.equal(project.frame.aspectRatio, null);
  assert.equal(project.frame.exportTarget, null);
  const projectPath = join(out, 'project.json');
  await writeFile(projectPath, JSON.stringify(project, null, 2));
  const child = spawn(
    process.execPath,
    [
      join(root, 'packages/cli/dist/bin.js'),
      projectPath,
      '--animate',
      '--scale',
      '1',
      '-o',
      join(out, 'cli.mp4'),
    ],
    {cwd: root, stdio: ['ignore', 'pipe', 'pipe']},
  );
  let stderr = '';
  child.stderr.on('data', data => (stderr += data));
  const status = await new Promise((resolve, reject) => {
    child.once('error', reject);
    child.once('close', resolve);
  });
  assert.equal(status, 0, stderr);
  await writeFile(join(out, 'cli.log'), stderr);
  const probe = file =>
    JSON.parse(
      execFileSync(ffprobe, [
        '-v',
        'error',
        '-show_entries',
        'stream=codec_name,profile,width,height,pix_fmt,color_range,color_space,color_transfer,color_primaries,nb_frames,r_frame_rate:format=duration',
        '-of',
        'json',
        file,
      ]),
    );
  const web = probe(join(out, 'web.mp4'));
  const cli = probe(join(out, 'cli.mp4'));
  await writeFile(
    join(out, 'metadata.json'),
    JSON.stringify({web, cli}, null, 2),
  );
  const ws = web.streams[0],
    cs = cli.streams[0];
  const metadataDifferences = [];
  for (const key of [
    'codec_name',
    'width',
    'height',
    'nb_frames',
    'r_frame_rate',
    'profile',
    'pix_fmt',
    'color_range',
    'color_space',
    'color_transfer',
    'color_primaries',
  ]) {
    if (cs[key] !== ws[key])
      metadataDifferences.push({key, web: ws[key], cli: cs[key]});
  }
  if (cli.format.duration !== web.format.duration)
    metadataDifferences.push({
      key: 'duration',
      web: web.format.duration,
      cli: cli.format.duration,
    });
  const fps =
    Number(ws.r_frame_rate.split('/')[0]) /
    Number(ws.r_frame_rate.split('/')[1]);
  const count = Number(ws.nb_frames);
  const indices = [
    ...new Set([
      0,
      Math.floor(count * 0.2),
      Math.floor(count * 0.4),
      Math.floor(count * 0.5),
      Math.floor(count * 0.6),
      Math.floor(count * 0.8),
      count - 1,
    ]),
  ];
  const diffs = [];
  for (const index of indices) {
    const images = [];
    for (const kind of ['web', 'cli']) {
      const path = join(out, `${kind}-${index}.png`);
      execFileSync(ffmpeg, [
        '-v',
        'error',
        '-i',
        join(out, `${kind}.mp4`),
        '-vf',
        `select='eq(n,${index})'`,
        '-frames:v',
        '1',
        '-y',
        path,
      ]);
      images.push(PNG.sync.read(await readFile(path)));
    }
    const [a, b] = images;
    const diff = new PNG({width: a.width, height: a.height});
    const changed = pixelmatch(a.data, b.data, diff.data, a.width, a.height, {
      threshold: 0.1,
    });
    await writeFile(join(out, `diff-${index}.png`), PNG.sync.write(diff));
    const percent = (changed / (a.width * a.height)) * 100;
    diffs.push({index, time: index / fps, percent});
  }
  const result = {
    status:
      metadataDifferences.length === 0 && diffs.every(diff => diff.percent <= 2)
        ? 'pass'
        : 'fail',
    scenario,
    requestedFps,
    webHead: process.env.A6_WEB_HEAD ?? null,
    metadataDifferences,
    backend: 'MSW',
    browser: browser.version(),
    head: execFileSync('git', ['rev-parse', 'HEAD'], {cwd: root})
      .toString()
      .trim(),
    web,
    cli,
    diffs,
    errors,
  };
  await writeFile(join(out, 'result.json'), JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result, null, 2));
  assert.deepEqual(metadataDifferences, [], 'Web/CLI metadata matches');
  assert.deepEqual(errors, []);
  assert.ok(
    diffs.every(diff => diff.percent <= 2),
    'Web/CLI frames differ by more than 2%',
  );
} catch (error) {
  await page
    .screenshot({path: join(out, 'failure.png'), fullPage: true})
    .catch(() => {});
  await writeFile(
    join(out, 'failure.aria.txt'),
    await page
      .locator('body')
      .ariaSnapshot()
      .catch(() => ''),
  );
  throw error;
} finally {
  await context.tracing.stop({path: join(out, 'trace.zip')});
  await context.close();
  await owner.close();
  await rm(profile, {recursive: true, force: true});
}
