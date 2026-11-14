import {SUPPORTED_LANGUAGES} from '@codeimage/config';
import {extname} from 'node:path';
import {parseArgs as parseNodeArgs} from 'node:util';
import type {ParseArgsOptionsConfig} from 'node:util';
import {THEME_REGISTRY} from '../../../apps/codeimage/src/state/theme/themeRegistry';
import {FLAGS} from './flags';
import {UsageError} from './errors';
export {UsageError} from './errors';

const DEFAULT_SCALE = 1;

export const USAGE = `Usage: codeimage [options] [file...]

Render code as an image. Each file becomes a tab. With no files, or with -
as a file, the code is read from stdin.

Options:
  -o, --output <path>  Output file, or - for stdout (default: codeimage.png)
  --format <type>      png, jpeg, webp, or svg (default: from -o, else png)
  --theme <id>         Theme id (default: fleetDark)
  --lang <id>          Language id for every tab (default: from the file name)
  --lines <a-b>        Render only lines a to b, numbered from a
  --preset <file>      JSON copied with "Copy as CLI config" in the web app
  --scale <n>          Pixel ratio, at most 3 (default: ${DEFAULT_SCALE})
  -h, --help           Show this help
${FLAGS.map(flag => flag.usage).join('')}
Examples:
  codeimage src/app.ts -o app.png
  cat app.py | codeimage --lang python -o - > app.png
`;

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

const OPTIONS = {
  lang: {type: 'string'},
  lines: {type: 'string'},
  theme: {type: 'string'},
  preset: {type: 'string'},
  format: {type: 'string'},
  scale: {type: 'string'},
  output: {type: 'string', short: 'o'},
  help: {type: 'boolean', short: 'h'},
} as const satisfies ParseArgsOptionsConfig;

export function parseArgs(argv: string[]) {
  let parsed;
  try {
    parsed = parseNodeArgs({
      args: argv,
      allowPositionals: true,
      options: Object.assign(
        {},
        ...FLAGS.map(flag => flag.options),
        OPTIONS,
      ) as typeof OPTIONS,
    });
  } catch (error) {
    throw new UsageError(
      error instanceof Error ? error.message : String(error),
    );
  }
  const {values, positionals: files} = parsed;
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
  for (const flag of FLAGS) flag.validate?.(values);
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
    values,
  } as const;
}

export type RenderArgs = Extract<
  ReturnType<typeof parseArgs>,
  {kind: 'render'}
>;
