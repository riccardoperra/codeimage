import {promisify} from 'node:util';
import {execFile} from 'node:child_process';
import {join, resolve} from 'node:path';
import assert from 'node:assert/strict';
import {mkdir, mkdtemp, rm, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {createServer} from 'vite';
import {launchChrome, serveFixtureImages} from '../lib';
import {fontFaces, createFixture} from './fixture';
import {runCell} from './cell';
declare global {
  interface Window {
    prepare(snapshot: unknown): Promise<{
      preset: string;
      image: string;
      imageOff: string;
      slot?: string;
    }>;
  }
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
  const browsers = await Promise.all([launchChrome(1), launchChrome(2)]);
  const fixtures = await serveFixtureImages();
  try {
    await server.listen();
    await mkdir(out, {recursive: true});
    const address = server.httpServer?.address();
    assert.ok(address && typeof address !== 'string');
    const url = `http://localhost:${address.port}`;
    const rows: string[] = [];
    for (const input of inputs) {
      const row = await runCell({
        input,
        fixtures,
        browsers,
        url,
        temporary,
        out,
        files,
        execute,
        root,
      });
      if (row) {
        rows.push(row);
        console.log(row);
      }
    }
    await writeFile(
      join(out, 'table.md'),
      [
        '| Cell | Size | Diff | Result | Watermark slot | Ink edge delta |',
        '| --- | --- | --- | --- | --- | --- |',
        ...rows,
      ].join('\n'),
    );
    assert.ok(
      rows.length,
      'Every document produced web and CLI images with the same watermark slot',
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
