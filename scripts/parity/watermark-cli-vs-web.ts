import assert from 'node:assert/strict';
import {execFile} from 'node:child_process';
import {mkdir, mkdtemp, readFile, rm, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {basename, dirname, join, resolve} from 'node:path';
import {promisify} from 'node:util';
import {createServer} from 'vite';
import {PNG} from 'pngjs';
import {snapshotMarkup} from '../../packages/render/dist/index.mjs';
import {
  diffPng,
  launchChrome,
  MAX_DIFF_PERCENT,
  serveFixtureImages,
} from './lib';

declare global {
  interface Window {
    prepare(
      snapshot: unknown,
    ): Promise<{preset: string; image: string; slot?: string}>;
  }
}

async function main() {
  const execute = promisify(execFile);
  const root = resolve(import.meta.dirname, '../..');
  const app = join(root, 'apps/codeimage');
  const out = process.env.P10_WEB_OUT ?? '/tmp/p10-cli-vs-web';
  const codeFont = (
    await readFile(
      join(
        root,
        'packages/render/node_modules/@fontsource-variable/jetbrains-mono/files/jetbrains-mono-latin-wght-normal.woff2',
      ),
    )
  ).toString('base64');
  const uiFont = (
    await readFile(
      join(
        root,
        'packages/render/node_modules/inter-ui/variable/InterVariable.woff2',
      ),
    )
  ).toString('base64');
  const faces = `<style>${[400, 500, 600, 650, 700, 800].map(weight => `@font-face{font-family:'Jetbrains Mono';src:url(data:font/woff2;base64,${codeFont});font-weight:${weight};font-style:normal}@font-face{font-family:'Inter var';src:url(data:font/woff2;base64,${uiFont});font-weight:${weight};font-style:normal}`).join('')}</style>`;
  const inputs = process.argv.slice(2);
  assert.ok(
    inputs.length,
    'Pass snapshot JSON files (the markup parity gate writes these).',
  );
  const temporary = await mkdtemp(join(app, 'src/render/.p10-'));
  const files = await mkdtemp(join(tmpdir(), 'p10-cli-'));
  const source = `
import '/src/assets/styles/app.scss';
import '/src/theme/global.css';
import {render} from 'solid-js/web';
import {StateProvider} from 'statebuilder';
import {getEditorStore} from '/src/state/editor';
import {getThemeStore} from '/src/state/theme/theme.store';
import {THEME_REGISTRY} from '/src/state/theme/themeRegistry';
import {loadLanguage} from '/src/core/snapshot/tokenize';
import {PreviewFrame} from '/src/components/Frame/PreviewFrame';
import {createRasterizer} from '/src/core/rasterize';
import {toCliConfig} from '/src/components/Presets/cliConfig';
document.head.insertAdjacentHTML('beforeend', ${JSON.stringify(faces)});
let dispose;
window.prepare = async snapshot => {
  dispose?.();
  const theme = await THEME_REGISTRY.find(theme => theme.id === snapshot.editor.options.themeId).load();
  const tab = snapshot.editor.editors[0];
  const language = await loadLanguage(tab.languageId, tab.tabName);
  let ref;
  const Setup = () => {
    const store = getEditorStore();
    store.editor.actions.setFromPersistedState(snapshot.editor);
    store.frame.setFromPersistedState({...snapshot.frame, background: snapshot.frame.background ?? theme.properties.previewBackground});
    store.frame.setWidth(snapshot.width ?? 0);
    store.frame.setHeight(0);
    store.terminal.setFromPersistedState({...snapshot.terminal, background: snapshot.terminal.background || theme.properties.terminal.main, textColor: snapshot.terminal.textColor || theme.properties.terminal.text});
    getThemeStore().getThemeResource(theme.id)[1].mutate(theme);
    return <PreviewFrame ref={node => ref = node} language={language} />;
  };
  dispose = render(() => <StateProvider><Setup /></StateProvider>, document.getElementById('root'));
  await document.fonts.load('400 16px "Jetbrains Mono"');
  await document.fonts.load('400 16px "Inter var"');
  await document.fonts.ready;
  await document.fonts.load('500 16px "CodeImage Signature"');
  await document.fonts.load('650 16px "CodeImage Signature"');
  await Promise.all([...ref.querySelectorAll('img')].map(image => image.decode()));
  await (await import('/src/core/watermark/browser')).prepareWatermarks(ref);
  await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  const store = getEditorStore();
  const preset = toCliConfig({frame: store.frame.stateToPersist(), terminal: store.terminal.stateToPersist(), editor: {...snapshot.editor.options}});
  const image = await createRasterizer('dom-export', 'dataUrl')(ref, {format: 'png', pixelRatio: snapshot.frame.exportTarget ? 1 : snapshot.scale, quality: 1, codeFont: store.editor.computed.selectedFont()});
  return {preset, image, slot: ref.querySelector('[data-watermark-home]')?.dataset.watermarkPlacement};
};
`;
  await writeFile(join(temporary, 'browser.tsx'), source);
  // Served by Vite, not a route: Chrome blocks a routed page's loopback images.
  await writeFile(
    join(temporary, 'index.html'),
    '<!doctype html><div id="root"></div><script type="module" src="./browser.tsx"></script>',
  );
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
      const snapshot = JSON.parse(await readFile(input, 'utf8'));
      if (snapshot.frame.signature?.avatar === 'profile') continue;
      if (snapshot.frame.background?.startsWith('link:'))
        snapshot.frame.background = snapshot.frame.background.replace(
          /^link:http:\/\/127\.0\.0\.1:\d+/,
          `link:${fixtures.url}`,
        );
      for (const tab of snapshot.editor.editors)
        tab.tabName = basename(tab.tabName);
      const name = input.split('/').at(-1)!.replace('.json', '');
      const page = await browsers[snapshot.frame.exportTarget ? 0 : 1].newPage({
        viewport: null,
      });
      page.on('pageerror', error => console.error(error.message));
      try {
        await page.goto(`${url}/src/render/${basename(temporary)}/index.html`, {
          waitUntil: 'domcontentloaded',
          timeout: 120000,
        });
        await page.waitForFunction(
          () => typeof window.prepare === 'function',
          undefined,
          {timeout: 120000},
        );
        const {preset, image, slot} = await page.evaluate(
          snapshot => window.prepare(snapshot),
          snapshot,
        );
        const web = join(out, `${name}-web.png`);
        const cli = join(out, `${name}-cli.png`);
        await writeFile(
          web,
          Buffer.from(image.slice(image.indexOf(',') + 1), 'base64'),
        );
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
          ...(snapshot.frame.exportTarget
            ? []
            : ['--scale', String(snapshot.scale)]),
          '-o',
          cli,
        ]);
        const markup = await snapshotMarkup(snapshot);
        const cliSlot = markup.html.match(
          /data-watermark-placement="([^"]+)"/,
        )?.[1];
        assert.equal(cliSlot, slot, `${name} watermark slot`);
        let percent = Number.POSITIVE_INFINITY;
        try {
          percent = await diffPng(web, cli, join(out, `${name}-diff.png`));
        } catch (error) {
          console.error(`${name} pixel comparison: ${String(error)}`);
        }
        const {width, height} = PNG.sync.read(await readFile(cli));
        const row = `| ${name} | ${width}x${height} | ${percent.toFixed(2)}% | ${percent <= MAX_DIFF_PERCENT ? 'pass' : 'pixel drift'} | ${slot} |`;
        rows.push(row);
        console.log(row);
      } finally {
        await page.close();
      }
    }
    await writeFile(
      join(out, 'table.md'),
      [
        '| Cell | Size | Diff | Result | Watermark slot |',
        '| --- | --- | --- | --- | --- |',
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
