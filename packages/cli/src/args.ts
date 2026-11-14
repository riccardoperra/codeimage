import {SUPPORTED_LANGUAGES} from '@codeimage/config';
import {extname} from 'node:path';
import {parseArgs as parseNodeArgs} from 'node:util';
import type {ParseArgsOptionsConfig} from 'node:util';
import {parseArgs as parseCittyArgs} from 'citty';
import type {ParsedArgs} from 'citty';
import {THEME_REGISTRY} from '../../../apps/codeimage/src/state/theme/themeRegistry';
import {FLAGS} from './flags';
import type {Flag, FlagValues} from './flags';
import {UsageError} from './errors';
export {UsageError} from './errors';

const DEFAULT_SCALE = 1;

export const ARGS = {
  'file...': {
    type: 'positional',
    required: false,
    description:
      'Each file becomes a tab. With no files, or with -, read stdin',
  },
  output: {
    type: 'string',
    alias: 'o',
    valueHint: 'path',
    description: 'Output file, or - for stdout (default: codeimage.png)',
  },
  format: {
    type: 'string',
    valueHint: 'type',
    description: 'png, jpeg, webp, or svg (default: from -o, else png)',
  },
  theme: {
    type: 'string',
    valueHint: 'id',
    description: 'Theme id (default: fleetDark)',
  },
  lang: {
    type: 'string',
    valueHint: 'id',
    description: 'Language id for every tab (default: from the file name)',
  },
  lines: {
    type: 'string',
    valueHint: 'a-b',
    description: 'Render only lines a to b, numbered from a',
  },
  preset: {
    type: 'string',
    valueHint: 'file',
    description: 'JSON copied with "Copy as CLI config" in the web app',
  },
  scale: {
    type: 'string',
    valueHint: 'n',
    description: `Pixel ratio, at most 3 (default: ${DEFAULT_SCALE})`,
  },
  help: {type: 'boolean', alias: 'h', description: 'Show this help'},
  ...Object.fromEntries(FLAGS.flatMap(flag => Object.entries(flag.args))),
} as const;

// Citty is permissive. Validate syntax from the same definitions, then pass
// canonical names and inline values to preserve aliases and dashed values.
// Camel case keeps literal --no-redact from becoming citty boolean negation.
export function normalizeArgs(argv: string[]) {
  const options: ParseArgsOptionsConfig = {};
  for (const [name, arg] of Object.entries<Flag['args'][string]>(ARGS)) {
    if (arg.type === 'string' || arg.type === 'boolean') {
      options[name] = {
        type: arg.type,
        ...(typeof arg.alias === 'string' && {short: arg.alias}),
        ...(arg.multiple !== undefined && {multiple: arg.multiple}),
      };
    }
  }
  try {
    const {tokens, positionals} = parseNodeArgs({
      args: argv,
      allowPositionals: true,
      tokens: true,
      options,
    });
    const flags = tokens
      .filter(token => token.kind === 'option')
      .map(token =>
        token.value === undefined
          ? `--${token.name.replace(/-([a-z])/g, (_, letter: string) => letter.toUpperCase())}`
          : `--${token.name}=${token.value}`,
      );
    return [...flags, '--', ...positionals];
  } catch (error) {
    throw new UsageError(
      error instanceof Error ? error.message : String(error),
    );
  }
}

const FORMATS = {
  png: 'png',
  jpeg: 'jpeg',
  jpg: 'jpeg',
  webp: 'webp',
  svg: 'svg',
} as const;

function formatOf(name: string) {
  return Object.hasOwn(FORMATS, name)
    ? FORMATS[name as keyof typeof FORMATS]
    : undefined;
}

export function resolveTheme(id: string, flag = '--theme') {
  const theme = THEME_REGISTRY.find(theme => theme.id === id);
  if (!theme) {
    throw new UsageError(
      `${flag}: unknown theme ${JSON.stringify(id)}. Valid ids: ${THEME_REGISTRY.map(theme => theme.id).join(', ')}`,
    );
  }
  return theme;
}

export function parseArgs(argv: string[]) {
  const rawArgs = normalizeArgs(argv);
  return renderArgs(parseCittyArgs<typeof ARGS>(rawArgs, ARGS), rawArgs);
}

export function renderArgs(values: ParsedArgs<typeof ARGS>, rawArgs: string[]) {
  const files = values._;
  if (values.help) return {kind: 'help'} as const;

  if (values.output === '') throw new UsageError('-o: expected a path or -');
  const format =
    values.format === undefined
      ? (formatOf(
          extname(values.output ?? '')
            .slice(1)
            .toLowerCase(),
        ) ?? 'png')
      : formatOf(values.format);
  if (!format) {
    throw new UsageError('--format: expected png, jpeg, webp, or svg');
  }
  const scale = Number(values.scale ?? DEFAULT_SCALE);
  if (!Number.isFinite(scale) || scale <= 0 || scale > 3) {
    throw new UsageError('--scale: expected a number above 0 and at most 3');
  }
  if (
    values.lang !== undefined &&
    !SUPPORTED_LANGUAGES.some(language => language.id === values.lang)
  ) {
    throw new UsageError(
      `--lang: unknown language ${JSON.stringify(values.lang)}. Valid ids: ${SUPPORTED_LANGUAGES.map(language => language.id).join(', ')}`,
    );
  }
  if (values.theme !== undefined) resolveTheme(values.theme);
  let lines: {start: number; end: number} | undefined;
  if (values.lines !== undefined) {
    const match = /^([1-9]\d*)-([1-9]\d*)$/.exec(values.lines);
    const start = Number(match?.[1]);
    const end = Number(match?.[2]);
    if (
      !Number.isSafeInteger(start) ||
      !Number.isSafeInteger(end) ||
      end < start
    ) {
      throw new UsageError('--lines: expected a range such as 10-30');
    }
    lines = {start, end};
  }
  if (values.preset === '')
    throw new UsageError('--preset: expected a JSON file path');
  if (files.filter(file => file === '-').length > 1) {
    throw new UsageError('stdin (-) can be given only once');
  }
  const flagValues: FlagValues = Object.fromEntries(
    Object.entries(values).filter(
      (entry): entry is [string, string | boolean] =>
        typeof entry[1] === 'string' || typeof entry[1] === 'boolean',
    ),
  );
  // Citty keeps only the last value. Restore repeatable options from the
  // normalized arguments, before the positional separator.
  const options = rawArgs.slice(0, rawArgs.indexOf('--'));
  for (const [name, arg] of Object.entries<Flag['args'][string]>(ARGS)) {
    if (!arg.multiple) continue;
    const prefix = `--${name}=`;
    const entries = options.filter(option => option.startsWith(prefix));
    if (entries.length)
      flagValues[name] = entries.map(option => option.slice(prefix.length));
  }
  for (const flag of FLAGS) flag.validate?.(flagValues);
  return {
    kind: 'render',
    files,
    language: values.lang,
    lines,
    theme: values.theme,
    preset: values.preset,
    format,
    scale,
    output: values.output ?? `codeimage.${format}`,
    values: flagValues,
  } as const;
}

export type RenderArgs = Extract<
  ReturnType<typeof parseArgs>,
  {kind: 'render'}
>;
