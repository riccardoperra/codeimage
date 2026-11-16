#!/usr/bin/env node
import {rmSync} from 'node:fs';
import {readFile, rename, rm, writeFile} from 'node:fs/promises';
import {renderUsage} from 'citty';
import {COMMAND, parseArgs, UsageError} from './args';
import {FLAGS} from './flags';
import {createRenderer} from '@codeimage/render';
import type {SnapshotDocument} from '@codeimage/render';
import {planAnimation} from './flags/animate';
import {runFontCommand} from './commands/fonts';
import {planImages} from './images';
import {parsePreset} from './snapshot';
import type {CodeInput} from './snapshot';
import {createUi} from './ui';
import {describeError} from './errors';
import {stopVideo} from './video/lifecycle';

const ui = createUi(process.argv.includes('--quiet'));

async function readInput(path: string, prefix = '') {
  try {
    return await readFile(path, 'utf8');
  } catch (error) {
    throw new UsageError(
      `${prefix}${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

async function readStdin() {
  if (process.stdin.isTTY) {
    throw new UsageError('stdin (-) is a terminal: pipe code into codeimage');
  }
  process.stdin.setEncoding('utf8');
  let code = '';
  for await (const chunk of process.stdin) code += chunk;
  if (!code) throw new UsageError('stdin is empty');
  return code;
}

async function main() {
  const args = parseArgs(process.argv.slice(2), !!process.stdout.isTTY);
  if (args.kind === 'help') {
    ui.usage(await renderUsage(COMMAND));
    ui.text(
      'Fonts: codeimage fonts install [ids...] [--all] [--offline] | list [--json] | clean [-y]',
    );
    ui.text(
      'Video: codeimage a.ts b.ts --animate -o demo.mp4 [--ffmpeg <path>] | codeimage install-ffmpeg',
    );
    return;
  }
  if (args.kind === 'install-ffmpeg') {
    const {downloadFfmpeg} = await import('./video/download');
    process.stdout.write(`${await downloadFfmpeg()}\n`);
    return;
  }
  if (args.kind !== 'render') {
    await runFontCommand(args, ui);
    return;
  }
  const renderer = createRenderer({
    offline: args.values.offline === true,
    onEvent: ui.fontEvent,
    codeFontFile:
      typeof args.values['font-file'] === 'string'
        ? args.values['font-file']
        : undefined,
  });
  if (!args.files.length && process.stdin.isTTY) {
    ui.usage(await renderUsage(COMMAND));
    process.exitCode = 2;
    return;
  }
  const preset = args.preset
    ? parsePreset(await readInput(args.preset, '--preset: '))
    : undefined;
  const files = args.files.length ? args.files : ['-'];
  const inputs: CodeInput[] = [];
  for (const file of files) {
    inputs.push(
      file === '-'
        ? {name: 'stdin', code: await readStdin()}
        : {name: file, code: await readInput(file)},
    );
  }
  const outputs = await planImages(args, inputs, preset);
  const render = (snapshot: SnapshotDocument) => {
    if (!args.animation) return renderer.render(snapshot);
    const {document, notes} = planAnimation(snapshot, args.animation, preset);
    for (const note of notes) ui.warn(note);
    return renderer.renderAnimation(document);
  };
  for (const output of outputs) {
    const started = performance.now();
    if (args.mp4 && args.animation) {
      const {document} = planAnimation(output.snapshot, args.animation, preset);
      const {exportMp4, resolveFfmpeg} = await import('./video/ffmpeg');
      const ffmpeg = await resolveFfmpeg({path: args.ffmpeg});
      const {bytes} = await ui.run('Rendering MP4', async () =>
        exportMp4({
          animation: await renderer.animationFrames(document),
          ffmpeg,
          output: output.path,
        }),
      );
      ui.rendered({path: output.path, bytes, ms: performance.now() - started});
      continue;
    }
    const image = await ui.run(
      args.animation ? 'Rendering the animation' : 'Rendering',
      () => render(output.snapshot),
    );
    if (output.path === '-') {
      await new Promise<void>((resolve, reject) => {
        process.stdout.write(image, error =>
          error ? reject(error) : resolve(),
        );
      });
    } else {
      await writeAtomically(output.path, image);
    }
    ui.rendered({
      path: output.path,
      bytes:
        typeof image === 'string' ? Buffer.byteLength(image) : image.byteLength,
      ms: performance.now() - started,
    });
    for (const flag of FLAGS) {
      for (const sidecar of flag.sidecars?.(output, args.values) ?? []) {
        await writeFile(sidecar.path, sidecar.text);
        ui.success(sidecar.path);
      }
    }
  }
}

let partial: string | undefined;

// An interrupted write leaves the previous file, or none, never a cut one.
async function writeAtomically(path: string, data: string | Uint8Array) {
  partial = `${path}.${process.pid}.partial`;
  try {
    await writeFile(partial, data);
    await rename(partial, path);
  } catch (error) {
    await rm(partial, {force: true});
    throw error;
  } finally {
    partial = undefined;
  }
}

// process.exit waits for the running native render, so the handler re-raises
// the signal with the default action instead.
function removePartialAndStop(signal: NodeJS.Signals) {
  stopVideo();
  if (partial) rmSync(partial, {force: true});
  process.removeAllListeners(signal);
  process.kill(process.pid, signal);
}

process.on('SIGINT', removePartialAndStop);
process.on('SIGTERM', removePartialAndStop);

let reported: unknown;
function report(error: unknown) {
  if (reported === error) return;
  reported = error;
  const description = describeError(error);
  ui.error(description);
  process.exitCode = description.exitCode;
}
process.stdout.on('error', report);
main().catch(report);
