#!/usr/bin/env node
import {readFile, writeFile} from 'node:fs/promises';
import {defineCommand, renderUsage, runCommand} from 'citty';
import {ARGS, normalizeArgs, renderArgs, UsageError} from './args';
import {FLAGS} from './flags';
import {renderSnapshot} from '@codeimage/render';
import {planImages} from './images';
import {parsePreset} from './snapshot';
import type {CodeInput} from './snapshot';

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

const command = defineCommand({
  meta: {name: 'codeimage', description: 'Render code as an image'},
  args: ARGS,
  async run({args: parsed, rawArgs}) {
    const args = renderArgs(parsed, rawArgs);
    if (args.kind === 'help') {
      process.stdout.write(await renderUsage(command));
      return;
    }
    if (!args.files.length && process.stdin.isTTY) {
      process.stderr.write(await renderUsage(command));
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
      const image = await renderSnapshot(output.snapshot);
      if (output.path === '-') {
        await new Promise<void>((resolve, reject) => {
          process.stdout.write(image, error =>
            error ? reject(error) : resolve(),
          );
        });
      } else {
        await writeFile(output.path, image);
        process.stdout.write(`${output.path}\n`);
      }
      for (const flag of FLAGS) {
        for (const sidecar of flag.sidecars?.(output, args.values) ?? []) {
          await writeFile(sidecar.path, sidecar.text);
          process.stdout.write(`${sidecar.path}\n`);
        }
      }
    }
  },
});

process.stdout.on('error', error => {
  process.stderr.write(`codeimage: ${error.message}\n`);
  process.exitCode = 1;
});

async function main() {
  await runCommand(command, {rawArgs: normalizeArgs(process.argv.slice(2))});
}

main().catch(error => {
  process.stderr.write(
    `codeimage: ${error instanceof Error ? error.message : String(error)}\n`,
  );
  if (error instanceof UsageError) {
    process.stderr.write('Run codeimage --help for usage.\n');
    process.exitCode = 2;
  } else {
    process.exitCode = 1;
  }
});
