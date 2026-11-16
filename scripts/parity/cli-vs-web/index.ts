import {promisify} from 'node:util';
import {execFile} from 'node:child_process';
import {basename, dirname, join, resolve} from 'node:path';
import assert from 'node:assert/strict';
import {
  copyFile,
  mkdir,
  mkdtemp,
  readFile,
  rm,
  writeFile,
} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {createServer} from 'vite';
import {
  diffPng,
  launchChrome,
  MAX_DIFF_PERCENT,
  serveFixtureImages,
} from '../lib';
import {PNG} from 'pngjs';
import {fontFaces, createFixture} from './fixture';
import {NEW_EDITOR_SCALE, checkNewEditorExport} from './editor-export';
declare global {
  interface Window {
    prepare(snapshot: unknown): Promise<{preset: string; image: string}>;
  }
}
async function compareExport(web: string, cli: string, diff: string) {
  const expected = PNG.sync.read(await readFile(cli));
  const actual = PNG.sync.read(await readFile(web));
  const sameSize =
    actual.width === expected.width && actual.height === expected.height;
  const percent = sameSize ? await diffPng(web, cli, diff) : null;
  return {
    web: {width: actual.width, height: actual.height},
    cli: {width: expected.width, height: expected.height},
    percent,
  };
}
export async function main() {
  const execute = promisify(execFile);
  const root = resolve(import.meta.dirname, '../../..');
  const app = join(root, 'apps/codeimage');
  const out = process.env.P10_WEB_OUT ?? '/tmp/p10-cli-vs-web';
  const faces = await fontFaces(root);
  const inputs = process.argv.slice(2);
  assert.ok(
    inputs.length,
    'Pass snapshot JSON files (the markup parity gate writes these).',
  );
  const temporary = await createFixture(app, faces);
  const files = await mkdtemp(join(tmpdir(), 'p10-cli-'));
  const server = await createServer({
    root: app,
    configFile: join(app, 'vite.config.ts'),
    server: {port: 0, strictPort: false},
    logLevel: 'error',
  });
  const browsers = await Promise.all([
    launchChrome(1),
    launchChrome(2),
    launchChrome(NEW_EDITOR_SCALE),
  ]);
  const fixtures = await serveFixtureImages();
  try {
    await server.listen();
    await mkdir(out, {recursive: true});
    const address = server.httpServer?.address();
    assert.ok(address && typeof address !== 'string');
    const url = `http://localhost:${address.port}`;
    const rows = [await checkNewEditorExport(browsers[2], url, out)];
    const results = [];
    for (const input of inputs) {
      const snapshot = JSON.parse(await readFile(input, 'utf8'));
      if (snapshot.editor.options.themeId === 'fleetTheme')
        snapshot.editor.options.themeId = 'fleetDark';
      if (snapshot.frame.signature?.avatar === 'profile') continue;
      if (snapshot.frame.background?.startsWith('link:'))
        snapshot.frame.background = snapshot.frame.background.replace(
          /^link:http:\/\/127\.0\.0\.1:\d+/,
          `link:${fixtures.url}`,
        );
      for (const tab of snapshot.editor.editors)
        tab.tabName = basename(tab.tabName);
      const name = input
        .substring(input.lastIndexOf('/') + 1)
        .replace('.json', '');
      const page = await browsers[snapshot.frame.exportTarget ? 0 : 1].newPage({
        viewport: null,
      });
      page.on('pageerror', error => console.error(error.message));
      try {
        await page.goto(`${url}/src/render/${basename(temporary)}/index.html`);
        await page.waitForFunction(
          () => typeof window.prepare === 'function',
          undefined,
          {timeout: 120000},
        );
        const {preset, image} = await page.evaluate(
          snapshot => window.prepare(snapshot),
          snapshot,
        );
        const web = join(out, `${name}-web.png`);
        const cli = join(out, `${name}-cli.png`);
        await writeFile(
          web,
          Buffer.from(image.slice(image.indexOf(',') + 1), 'base64'),
        );
        if (process.env.P10_WEB_EXPORTS)
          await copyFile(join(process.env.P10_WEB_EXPORTS, `${name}.png`), web);
        const presetFile = join(files, `${name}.json`);
        await writeFile(presetFile, preset);
        const codeFiles: string[] = [];
        for (const tab of snapshot.editor.editors) {
          const file = join(files, tab.tabName || 'untitled.ts');
          await mkdir(dirname(file), {recursive: true});
          await writeFile(file, tab.code);
          codeFiles.push(file);
        }
        await execute(process.execPath, [
          join(root, 'packages/cli/dist/bin.js'),
          ...codeFiles,
          '--preset',
          presetFile,
          '--scale',
          String(snapshot.frame.exportTarget ? 1 : snapshot.scale),
          '-o',
          cli,
        ]);
        const result = await compareExport(
          web,
          cli,
          join(out, `${name}-diff.png`),
        );
        const {
          web: actual,
          cli: {width, height},
          percent,
        } = result;
        results.push({name, ...result});
        const difference =
          percent === null
            ? `size mismatch (web ${actual.width}x${actual.height})`
            : `${percent.toFixed(3)}%`;
        const row = `| ${name} | ${width}x${height} | ${difference} | ${percent !== null && percent <= MAX_DIFF_PERCENT ? 'pass' : 'FAIL'} |`;
        rows.push(row);
        console.log(row);
      } finally {
        await page.close();
      }
    }
    await writeFile(
      join(out, 'results.json'),
      JSON.stringify(results, null, 2),
    );
    await writeFile(
      join(out, 'table.md'),
      [
        '| Cell | Size | Diff | Result |',
        '| --- | --- | --- | --- |',
        ...rows,
      ].join('\n'),
    );
    assert.ok(
      rows.length && rows.every(row => row.endsWith('pass |')),
      'Every web export must match the CLI',
    );
  } finally {
    await Promise.all(browsers.map(browser => browser.close()));
    await fixtures.close();
    await server.close();
    await rm(temporary, {recursive: true, force: true});
    await rm(files, {recursive: true, force: true});
  }
}
main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
