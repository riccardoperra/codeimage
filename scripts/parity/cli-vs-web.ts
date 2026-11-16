import assert from 'node:assert/strict';
import {execFile} from 'node:child_process';
import {mkdir, mkdtemp, readFile, rm, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {basename, dirname, join, resolve} from 'node:path';
import {promisify} from 'node:util';
import pixelmatch from 'pixelmatch';
import type {Browser} from 'playwright';
import {createServer} from 'vite';
import {PNG} from 'pngjs';
import {
  diffPng,
  launchChrome,
  MAX_DIFF_PERCENT,
  PIXELMATCH_THRESHOLD,
  serveFixtureImages,
} from './lib';

declare global {
  interface Window {
    prepare(snapshot: unknown): Promise<{preset: string; image: string}>;
  }
}

// The export store's default pixel ratio.
const NEW_EDITOR_SCALE = 3;

// The cells below build PreviewFrame with every input already loaded. The real
// new editor mounts its export copy while the themes still load, so it gets
// its own check: the theme list fills, and the Export button downloads a PNG
// that matches the export copy.
async function checkNewEditorExport(
  browser: Browser,
  url: string,
  out: string,
) {
  const page = await browser.newPage({viewport: null});
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  try {
    await page.goto(`${url}/?v=4`, {waitUntil: 'commit'});
    await page
      .locator('.cm-content[contenteditable="true"]')
      .waitFor({state: 'attached', timeout: 600_000});
    await page
      .locator('[data-theme-list] [data-theme-option]')
      .nth(1)
      .waitFor({state: 'attached', timeout: 60_000})
      .catch(() => assert.fail(`The theme list stayed empty: ${errors}`));
    await page.evaluate(() => document.fonts.ready);
    const copy = page.locator('[data-snapshot-frame]');
    const lines = (root: string) =>
      page
        .locator(`${root} .cm-line`)
        .evaluateAll(lines => lines.map(line => line.textContent).join('\n'));
    assert.equal(
      await lines('[data-snapshot-frame] [data-static-code-view]'),
      await lines('.cm-content[contenteditable="true"]'),
      'The export copy shows the editor code',
    );
    // The copy sits in an invisible portal; show it for the screenshot.
    await copy.evaluate(frame => {
      const portal = frame.parentElement!.parentElement!;
      portal.style.setProperty('opacity', '1', 'important');
      portal.style.setProperty('z-index', '2147483647', 'important');
      portal.dataset.parityPortal = '';
    });
    await page.addStyleTag({
      content: '[data-parity-portal]::after{display:none!important}',
    });
    const preview = PNG.sync.read(await copy.screenshot());
    await copy.evaluate(frame => {
      const portal = frame.parentElement!.parentElement!;
      portal.style.removeProperty('opacity');
      portal.style.removeProperty('z-index');
      delete portal.dataset.parityPortal;
    });
    // What's new opens a few seconds after load as a modal alert dialog,
    // which hides the editor from the accessibility tree. Minimize it.
    const news = page.getByRole('button', {name: "Minimize what's new"});
    await news.waitFor({timeout: 15_000}).then(
      () => news.click(),
      () => undefined,
    );
    const download = page.waitForEvent('download', {timeout: 120_000});
    await page.getByRole('button', {name: 'Export', exact: true}).click();
    const file = join(out, 'new-editor-export.png');
    await (await download).saveAs(file);
    const bytes = await readFile(file);
    assert.ok(bytes.length > 0, `The export downloaded no image: ${errors}`);
    const image = PNG.sync.read(bytes);
    // The screenshot rounds the copy's fractional width out, the export in.
    for (const side of ['width', 'height'] as const)
      assert.ok(
        Math.abs(image[side] - preview[side]) <= NEW_EDITOR_SCALE,
        `export ${side} ${image[side]}, export copy ${preview[side]}`,
      );
    const width = Math.min(image.width, preview.width);
    const height = Math.min(image.height, preview.height);
    const crop = (png: PNG) => {
      const cropped = new PNG({width, height});
      PNG.bitblt(png, cropped, 0, 0, width, height, 0, 0);
      return cropped;
    };
    const diff = new PNG({width, height});
    const percent =
      (pixelmatch(
        crop(image).data,
        crop(preview).data,
        diff.data,
        width,
        height,
        {threshold: PIXELMATCH_THRESHOLD},
      ) /
        (width * height)) *
      100;
    await writeFile(
      join(out, 'new-editor-export-diff.png'),
      PNG.sync.write(diff),
    );
    assert.deepEqual(errors, [], 'The new editor threw');
    const row = `| new editor export | ${image.width}x${image.height} | ${percent.toFixed(2)}% | ${percent <= MAX_DIFF_PERCENT ? 'pass' : 'FAIL'} |`;
    console.log(row);
    return row;
  } finally {
    await page.close();
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
  await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  const store = getEditorStore();
  const preset = toCliConfig({frame: store.frame.stateToPersist(), terminal: store.terminal.stateToPersist(), editor: {...snapshot.editor.options}});
  const image = await createRasterizer('dom-export', 'dataUrl')(ref, {format: 'png', pixelRatio: snapshot.frame.exportTarget ? 1 : snapshot.scale, quality: 1, codeFont: store.editor.computed.selectedFont()});
  return {preset, image};
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
        const percent = await diffPng(web, cli, join(out, `${name}-diff.png`));
        const {width, height} = PNG.sync.read(await readFile(cli));
        const row = `| ${name} | ${width}x${height} | ${percent.toFixed(2)}% | ${percent <= MAX_DIFF_PERCENT ? 'pass' : 'FAIL'} |`;
        rows.push(row);
        console.log(row);
      } finally {
        await page.close();
      }
    }
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
