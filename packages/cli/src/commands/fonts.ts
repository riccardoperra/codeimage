import {openFontCache} from '@codeimage/render';
import {parseArgs} from 'node:util';
import {UsageError} from '../errors';
import type {Ui} from '../ui';

export function parseFontArgs(argv: string[]) {
  const [command, ...rest] = argv;
  let args;
  try {
    args = parseArgs({
      args: rest,
      allowPositionals: true,
      options: {
        all: {type: 'boolean'},
        json: {type: 'boolean'},
        offline: {type: 'boolean'},
        quiet: {type: 'boolean'},
        yes: {type: 'boolean', short: 'y'},
        help: {type: 'boolean', short: 'h'},
      },
    });
  } catch (error) {
    throw new UsageError(
      error instanceof Error ? error.message : String(error),
    );
  }
  const {values, positionals: ids} = args;
  if (!command || command === '--help' || command === '-h' || values.help)
    return {kind: 'help'} as const;
  const quiet = values.quiet ?? false;
  const offline = values.offline ?? false;
  if (command === 'install' && !values.json && !values.yes) {
    if (values.all && ids.length)
      throw new UsageError('fonts install: use font ids or --all, not both');
    return {
      kind: 'fonts-install',
      ids,
      all: values.all ?? false,
      offline,
      quiet,
    } as const;
  }
  if (command === 'list' && !ids.length && !values.all && !values.yes)
    return {kind: 'fonts-list', json: values.json ?? false, quiet} as const;
  if (command === 'clean' && !ids.length && !values.all && !values.json)
    return {kind: 'fonts-clean', yes: values.yes ?? false, quiet} as const;
  throw new UsageError(
    'Expected fonts install [ids...] [--all], fonts list [--json], or fonts clean [-y]',
  );
}
export type FontCommand = Exclude<
  ReturnType<typeof parseFontArgs>,
  {kind: 'help'}
>;
export async function runFontCommand(args: FontCommand, ui: Ui) {
  const cache = openFontCache({
    offline: args.kind === 'fonts-install' && args.offline,
    onEvent: ui.fontEvent,
  });
  if (args.kind === 'fonts-clean') {
    if (
      !args.yes &&
      ui.prompts &&
      !(await ui.prompts.confirm(
        'Clear cached fonts? Active renders may refill the cache.',
      ))
    )
      return;
    await cache.clean();
    ui.success('cleared font cache');
  } else if (args.kind === 'fonts-list') {
    const inventory = await cache.list();
    if (args.json) {
      process.stdout.write(`${JSON.stringify(inventory, null, 2)}\n`);
    } else {
      ui.text(
        `${inventory.map(font => `${font.id.padEnd(20)} ${font.label.padEnd(20)} ${font.state.padEnd(8)} ${font.filesLocal}/${font.files} files ${font.bytesLocal}/${font.bytes} B  ${font.source}`).join('\n')}\nCache: ${cache.dir}\n`,
      );
    }
  } else {
    const inventory = await cache.list();
    let names = args.ids;
    if (!names.length && !args.all) {
      if (!ui.prompts)
        throw new UsageError('fonts install: specify font ids or --all');
      names = await ui.prompts.pick(
        inventory.map(font => ({value: font.id, label: font.label})),
      );
      if (!names.length) return;
    }
    const ids = names.map(id => {
      const font = inventory.find(
        font => font.id.toLowerCase() === id.toLowerCase(),
      );
      if (!font)
        throw new UsageError(
          `Unknown font "${id}". Valid ids: ${inventory.map(font => font.id).join(', ')}`,
        );
      return font.id;
    });
    await ui.run('Installing fonts', () =>
      cache.install(args.all ? 'all' : ids),
    );
    ui.success('fonts installed');
  }
}
