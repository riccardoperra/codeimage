#!/usr/bin/env node
import {readFile, writeFile} from 'node:fs/promises';
import {parseArgs, UsageError, USAGE} from './args';
import {buildSnapshot, parsePreset} from './snapshot';
import type {CodeInput} from './snapshot';
import {renderSnapshot} from './render';

async function readInput(path: string, flag: string) {
  try {
    return await readFile(path, 'utf8');
  } catch (error) {
    throw new UsageError(
      `${flag}: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

async function readStdin() {
  if (process.stdin.isTTY)
    throw new UsageError('input: provide a file or pipe code through stdin');
  process.stdin.setEncoding('utf8');
  let code = '';
  for await (const chunk of process.stdin) code += chunk;
  if (!code.length)
    throw new UsageError('input: provide a file or pipe code through stdin');
  return code;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.kind === 'help') {
    process.stdout.write(USAGE);
    return;
  }
  const preset = args.preset
    ? parsePreset(await readInput(args.preset, '--preset'))
    : undefined;
  const files = args.files.length ? args.files : ['-'];
  const inputs: CodeInput[] = [];
  for (const file of files) {
    inputs.push({
      name: file === '-' ? 'stdin' : file,
      code: file === '-' ? await readStdin() : await readInput(file, 'input'),
    });
  }
  const snapshot = await buildSnapshot({args, inputs, preset});
  const image = await renderSnapshot(snapshot);
  if (args.output === '-') {
    await new Promise<void>((resolve, reject) => {
      process.stdout.write(image, error => (error ? reject(error) : resolve()));
    });
  } else {
    await writeFile(args.output, image);
    process.stdout.write(`${args.output}\n`);
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
    process.stderr.write(`\n${USAGE}`);
    process.exitCode = 2;
  } else {
    process.exitCode = 1;
  }
});
