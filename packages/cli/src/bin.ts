#!/usr/bin/env node
import {readFile, writeFile} from 'node:fs/promises';
import {renderUsage} from 'citty';
import {COMMAND, parseArgs, UsageError} from './args';
import {FLAGS} from './flags';
import {createRenderer} from '@codeimage/render';
import {runFontCommand} from './commands/fonts';
import {planImages} from './images';
import {parsePreset} from './snapshot';
import type {CodeInput} from './snapshot';
import {createUi} from './ui';
import {describeError} from './errors';

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
  for (const output of outputs) {
    const started = performance.now();
    const image = await ui.run('Rendering', () =>
      renderer.render(output.snapshot),
    );
    if (output.path === '-') {
      await new Promise<void>((resolve, reject) => {
        process.stdout.write(image, error =>
          error ? reject(error) : resolve(),
        );
      });
    } else {
      await writeFile(output.path, image);
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
