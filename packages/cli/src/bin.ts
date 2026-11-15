#!/usr/bin/env node
import {rmSync} from 'node:fs';
import {readFile, rename, rm, writeFile} from 'node:fs/promises';
import {renderUsage} from 'citty';
import {COMMAND, parseArgs, UsageError} from './args';
import {FLAGS} from './flags';
import {planAnimation} from './flags/animate';
import {renderAnimation, renderSnapshot} from '@codeimage/render';
import type {SnapshotDocument} from '@codeimage/render';
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

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.kind === 'help') {
    process.stdout.write(await renderUsage(COMMAND));
    return;
  }
  if (!args.files.length && process.stdin.isTTY) {
    process.stderr.write(await renderUsage(COMMAND));
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
    if (!args.animation) return renderSnapshot(snapshot);
    const {document, notes} = planAnimation(snapshot, args.animation, preset);
    for (const note of notes) process.stderr.write(`codeimage: ${note}\n`);
    return renderAnimation(document);
  };
  for (const output of outputs) {
    const image = await render(output.snapshot);
    if (output.path === '-') {
      await new Promise<void>((resolve, reject) => {
        process.stdout.write(image, error =>
          error ? reject(error) : resolve(),
        );
      });
    } else {
      await writeAtomically(output.path, image);
      process.stdout.write(`${output.path}\n`);
    }
    for (const flag of FLAGS) {
      for (const sidecar of flag.sidecars?.(output, args.values) ?? []) {
        await writeFile(sidecar.path, sidecar.text);
        process.stdout.write(`${sidecar.path}\n`);
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
  if (partial) rmSync(partial, {force: true});
  process.removeAllListeners(signal);
  process.kill(process.pid, signal);
}

process.on('SIGINT', removePartialAndStop);
process.on('SIGTERM', removePartialAndStop);

process.stdout.on('error', error => {
  process.stderr.write(`codeimage: ${error.message}\n`);
  process.exitCode = 1;
});

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
