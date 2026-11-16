import {mkdir, readFile, writeFile} from 'node:fs/promises';
import {basename, dirname, join} from 'node:path';
import assert from 'node:assert/strict';
import {snapshotMarkup} from '../../../packages/render/dist/index.mjs';
import type {launchChrome, serveFixtureImages} from '../lib';
import {diffPng, MAX_DIFF_PERCENT} from '../lib';
import {PNG} from 'pngjs';
import {inkBounds} from './ink';
export async function runCell({
  input,
  fixtures,
  browsers,
  url,
  temporary,
  out,
  files,
  execute,
  root,
}: CellContext) {
  const snapshot = JSON.parse(await readFile(input, 'utf8'));
  if (snapshot.frame.signature?.avatar === 'profile') return;
  if (snapshot.frame.background?.startsWith('link:'))
    snapshot.frame.background = snapshot.frame.background.replace(
      /^link:http:\/\/127\.0\.0\.1:\d+/,
      `link:${fixtures.url}`,
    );
  for (const tab of snapshot.editor.editors)
    tab.tabName = basename(tab.tabName);
  const name = input.substring(input.lastIndexOf('/') + 1).replace('.json', '');
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
    const {preset, image, imageOff, slot} = await page.evaluate(
      snapshot => window.prepare(snapshot),
      snapshot,
    );
    const web = join(out, `${name}-web.png`);
    const cli = join(out, `${name}-cli.png`);
    await writeFile(
      web,
      Buffer.from(image.slice(image.indexOf(',') + 1), 'base64'),
    );
    const webOff = join(out, `${name}-web-off.png`);
    await writeFile(
      webOff,
      Buffer.from(imageOff.slice(imageOff.indexOf(',') + 1), 'base64'),
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
    const withoutWatermark = JSON.parse(preset);
    withoutWatermark.terminal.showWatermark = false;
    const offPreset = join(files, `${name}-off.json`);
    await writeFile(offPreset, JSON.stringify(withoutWatermark));
    const cliOff = join(out, `${name}-cli-off.png`);
    await execute(process.execPath, [
      join(root, 'packages/cli/dist/bin.js'),
      ...codeFiles,
      '--preset',
      offPreset,
      ...(snapshot.frame.exportTarget
        ? []
        : ['--scale', String(snapshot.scale)]),
      '-o',
      cliOff,
    ]);
    const deltas = await compareInk({
      web,
      webOff,
      cli,
      cliOff,
      slot,
      out,
      name,
    });
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
    const row = `| ${name} | ${width}x${height} | ${percent.toFixed(2)}% | ${percent <= MAX_DIFF_PERCENT ? 'pass' : 'pixel drift'} | ${slot} | ${Math.max(...Object.values(deltas).map(Math.abs)).toFixed(2)}px |`;
    return row;
  } finally {
    await page.close();
  }
}
export type CellContext = {
  input: string;
  fixtures: Awaited<ReturnType<typeof serveFixtureImages>>;
  browsers: Awaited<ReturnType<typeof launchChrome>>[];
  url: string;
  temporary: string;
  out: string;
  files: string;
  execute: (file: string, args: string[]) => Promise<unknown>;
  root: string;
};

async function compareInk({
  web,
  webOff,
  cli,
  cliOff,
  slot,
  out,
  name,
}: {
  web: string;
  webOff: string;
  cli: string;
  cliOff: string;
  slot?: string;
  out: string;
  name: string;
}) {
  const browserInk = await inkBounds(web, webOff);
  const cliInk = await inkBounds(cli, cliOff);
  const right =
    slot === 'home' || slot === 'unavoidable' || slot?.endsWith('-right');
  const bottom =
    slot === 'home' ||
    slot === 'unavoidable' ||
    slot?.startsWith('frame-bottom');
  const dx = right ? cliInk.imageWidth - browserInk.imageWidth : 0;
  const dy = bottom ? cliInk.imageHeight - browserInk.imageHeight : 0;
  const deltas = {
    left: cliInk.left - browserInk.left - dx,
    right: cliInk.right - browserInk.right - dx,
    top: cliInk.top - browserInk.top - dy,
    bottom: cliInk.bottom - browserInk.bottom - dy,
  };
  await writeFile(
    join(out, `${name}-ink.json`),
    JSON.stringify({browserInk, cliInk, deltas}, null, 2),
  );
  assert.ok(
    Object.values(deltas).every(delta => Math.abs(delta) <= 2),
    `${name} actual CLI watermark ink differs from browser by more than 2px: ${JSON.stringify(deltas)}`,
  );
  return deltas;
}
