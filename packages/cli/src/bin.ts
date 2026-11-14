#!/usr/bin/env node
import {readFile, writeFile} from 'node:fs/promises';
import {parseArgs, UsageError, USAGE} from './args';
import {FLAGS} from './flags';
import {renderSnapshot} from '@codeimage/render';
import {buildSnapshot, parsePreset} from './snapshot';
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
    process.stdout.write(USAGE);
    return;
  }
  if (!args.files.length && process.stdin.isTTY) {
    process.stderr.write(USAGE);
    process.exitCode = 2;
    return;
  }
  const preset = args.preset
    ? parsePreset(await readInput(args.preset, '--preset: '))
    : undefined;
  const files = args.files.length ? args.files : ['-'];
  let inputs: CodeInput[] = [];
  for (const file of files) {
    inputs.push(
      file === '-'
        ? {name: 'stdin', code: await readStdin()}
        : {name: file, code: await readInput(file)},
    );
  }
  for (const flag of FLAGS) {
    if (flag.prepareInputs)
      inputs = await flag.prepareInputs(inputs, args.values);
  }
  const snapshot = FLAGS.reduce(
    (snapshot, flag) => flag.apply(snapshot, args.values),
    await buildSnapshot({args, inputs, preset}),
  );
  let outputs = [{snapshot, path: args.output}];
  for (const flag of FLAGS) {
    const expand = flag.outputs;
    if (expand)
      outputs = outputs.flatMap(output => expand(output, args.values));
  }
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
}

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
