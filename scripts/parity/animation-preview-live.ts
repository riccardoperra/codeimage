import type {getEditorStore} from '../../apps/codeimage/src/state/editor/index';
import assert from 'node:assert/strict';
import {mkdir, readFile, writeFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {chromium} from 'playwright';
import pixelmatch from 'pixelmatch';
import {PNG} from 'pngjs';

declare const window: Window & {parityStore: ReturnType<typeof getEditorStore>};
type FontFile = {
  file: string;
  weight?: number;
  unicodeRange?: [number, number][];
};
export async function runPreviewParity(options: {
  url: string;
  out: string;
  renderRoot: string;
  scale?: number;
  freeSize?: boolean;
}) {
  const root = resolve(options.renderRoot);
  const scale = options.scale ?? 2;
  const require = createRequire(`${root}/package.json`);
  const {Renderer} = require('@takumi-rs/core');
  const renderer = new Renderer();
  const dist = pathToFileURL(`${root}/dist/`);
  const manifest = JSON.parse(
    await readFile(new URL('fonts/manifest.json', dist), 'utf8'),
  ) as {fonts: Record<string, FontFile[]>};
  const fontFamilies = ['Inter var', 'Inter', 'Jetbrains Mono'];
  let faces = '';
  for (const name of fontFamilies) {
    for (const {file, weight, unicodeRange} of manifest.fonts[
      name === 'Jetbrains Mono' ? 'jetbrains-mono' : 'ui'
    ]) {
      const data = await readFile(new URL(`fonts/${file}`, dist));
      await renderer.registerFont({name, data, weight, unicodeRange});
      const ranges = unicodeRange
        ?.map(([start, end]) => `U+${start.toString(16)}-${end.toString(16)}`)
        .join(',');
      faces += `@font-face{font-family:"${name}";src:url(data:font/woff2;base64,${data.toString('base64')});font-weight:${weight ?? '1 1000'};${ranges ? `unicode-range:${ranges};` : ''}}`;
    }
  }
  await mkdir(options.out, {recursive: true});
  const browser = await chromium.launch({channel: 'chrome'});
  const app = await browser.newPage({viewport: {width: 1440, height: 900}});
  const reference = await browser.newPage({
    viewport: {width: 1440, height: 900},
    deviceScaleFactor: scale,
  });
  let comparisons = 0;
  const results: {mode: string; ms: number; diff: number}[] = [];
  try {
    await app.goto(`${options.url}?v=2`, {waitUntil: 'domcontentloaded'});
    await app
      .locator('.cm-content[contenteditable=true]')
      .first()
      .waitFor({timeout: 60000});
    const close = app.getByRole('button', {name: 'close', exact: true});
    if (await close.isVisible()) await close.click();
    await app.addStyleTag({content: faces});
    await app.evaluate(async freeSize => {
      const path = '/src/state/editor/index.ts';
      const {getEditorStore} = await import(path);
      const store = getEditorStore();
      Object.assign(window, {parityStore: store});
      store.editor.actions.setFromPersistedState({
        options: store.editor.stateToPersist().options,
        editors: [
          {
            id: 'a',
            tabName: 'user.ts',
            code: 'const greeting = "hello";',
            languageId: 'typescript',
            lineNumberStart: 1,
          },
          {
            id: 'b',
            tabName: 'user.ts',
            code: 'const greeting = "hello";\nconsole.log(greeting);',
            languageId: 'typescript',
            lineNumberStart: 1,
          },
          {
            id: 'c',
            tabName: 'test.ts',
            code: 'console.log("goodbye");',
            languageId: 'typescript',
            lineNumberStart: 1,
          },
        ],
      });
      store.frame.setExportTarget(freeSize ? null : 'x-landscape');
      store.animation.actions.setFromPersistedState({
        steps: [
          {id: 'a', editorId: 'a', holdMs: 800},
          {
            id: 'b',
            editorId: 'b',
            holdMs: 500,
            transition: {ms: 701, easing: 'cubic-bezier(0.25, 0.1, 0.25, 1)'},
          },
          {
            id: 'c',
            editorId: 'c',
            holdMs: 800,
            transition: {ms: 431, easing: 'strong'},
          },
        ],
      });
      store.animation.actions.setOpen(true);
      await document.fonts.ready;
    }, options.freeSize ?? false);
    for (const mode of ['tab', 'title', 'tabs'] as const) {
      await app.evaluate(mode => {
        const store = window.parityStore;
        store.animation.actions.setHeader({mode, title: 'A story'});
        store.animation.actions.seek(100);
      }, mode);
      await app.locator('[data-animation-stage]:visible').waitFor();
      // Every hold and both halves of each independently timed transition.
      for (const ms of [
        100, 800, 975, 1150, 1326, 1500, 1600, 2001, 2109, 2217, 2324, 2431,
        2600,
      ]) {
        await app.evaluate(
          ms => window.parityStore.animation.actions.seek(ms),
          ms,
        );
        await app.waitForTimeout(30);
        const snapshot = await app.evaluate(() => {
          const stage = document.querySelector<HTMLElement>(
            '[data-animation-stage]:not([hidden])',
          )!;
          const scene = [
            ...stage.querySelectorAll<HTMLElement>('[data-animation-scene]'),
          ].find(scene => scene.style.display !== 'none')!;
          const computed = getComputedStyle(scene);
          const width = parseInt(computed.width),
            height = parseInt(computed.height);
          const declarations = [...computed]
            .filter(name => name.startsWith('--'))
            .map(name => `${name}:${computed.getPropertyValue(name)}`)
            .join(';');
          const css = [...document.styleSheets]
            .flatMap(sheet => {
              try {
                return [...sheet.cssRules].map(rule => rule.cssText);
              } catch {
                return [];
              }
            })
            .join('\n');
          const animations = scene.getAnimations({subtree: true});
          return {
            html: `<div data-animation-stage style="width:${width}px;height:${height}px;${declarations.replaceAll('"', '&quot;')};font-family:${computed.fontFamily.replaceAll('"', '&quot;')};font-size:${computed.fontSize};line-height:${computed.lineHeight};color:${computed.color}">${scene.outerHTML}</div>`,
            css,
            width,
            height,
            localMs: Number(animations[0]?.currentTime ?? 0),
          };
        });
        const css = `${snapshot.css}\nhtml,body{margin:0!important;background:transparent!important} [data-animation-stage]{position:relative!important;zoom:1!important}`;
        await reference.setViewportSize({
          width: snapshot.width,
          height: snapshot.height,
        });
        await reference.setContent(
          `<style>${faces}${css}</style>${snapshot.html}`,
        );
        await reference.evaluate(async time => {
          await document.fonts.ready;
          for (const animation of document.getAnimations()) {
            animation.pause();
            animation.currentTime = time;
          }
        }, snapshot.localMs);
        const chrome = await reference
          .locator('[data-animation-stage]')
          .screenshot({omitBackground: true, animations: 'allow'});
        const takumi = Buffer.from(
          await renderer.render(snapshot.html, {
            width: snapshot.width * scale,
            height: snapshot.height * scale,
            css: [css],
            fontFamilies,
            format: 'png',
            devicePixelRatio: scale,
            timeMs: snapshot.localMs,
          }),
        );
        const a = PNG.sync.read(chrome),
          b = PNG.sync.read(takumi);
        const diff = new PNG({width: a.width, height: a.height});
        const changed = pixelmatch(
          a.data,
          b.data,
          diff.data,
          a.width,
          a.height,
          {threshold: 0.1},
        );
        const percent = (changed / (a.width * a.height)) * 100;
        results.push({mode, ms, diff: percent});
        comparisons++;
        if (percent > 0.5) {
          await writeFile(`${options.out}/${mode}-${ms}-chrome.png`, chrome);
          await writeFile(`${options.out}/${mode}-${ms}-takumi.png`, takumi);
          await writeFile(
            `${options.out}/${mode}-${ms}-diff.png`,
            PNG.sync.write(diff),
          );
        }
      }
    }
    await writeFile(
      `${options.out}/results.json`,
      JSON.stringify(results, null, 2),
    );
    const failed = results.filter(result => result.diff > 0.5);
    console.log(
      `${comparisons - failed.length}/${comparisons} Chrome/Takumi frames within 0.5%; worst ${Math.max(...results.map(result => result.diff)).toFixed(3)}%`,
    );
    assert.equal(
      failed.length,
      0,
      'Preview parity: see results.json and diff images',
    );
  } finally {
    await browser.close();
  }
}
