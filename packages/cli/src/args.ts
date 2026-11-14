import {SUPPORTED_LANGUAGES} from '@codeimage/config';
import {parseArgs as parseNodeArgs} from 'node:util';
import {THEME_REGISTRY} from '../../../apps/codeimage/src/state/theme/themeRegistry';

export const USAGE = `Usage: codeimage [files...] [options]

Read files as tabs, or pipe code through stdin. Use - for a stdin tab.

  --lang <id>        Override the language inferred from each file name
  --lines <10-30>    Include an inclusive line range and show its gutter
  --theme <id>      Use a CodeImage theme
  --preset <file>   Read JSON from Copy as CLI config in the preset menu
  --format <type>   png (default), jpeg, webp, or svg
  --scale <n>       Positive image scale (default: 1)
  -o <path>         Output path (default: codeimage.<format>), or - for stdout
  -h, --help        Show this help
`;

export class UsageError extends Error {}

export function resolveTheme(id: string, flag = '--theme') {
  const theme = THEME_REGISTRY.find(theme => theme.id === id);
  if (!theme) {
    throw new UsageError(
      `${flag}: unknown theme ${JSON.stringify(id)}. Valid ids: ${THEME_REGISTRY.map(theme => theme.id).join(', ')}`,
    );
  }
  return theme;
}

export function inferLanguage(file: string) {
  return (
    SUPPORTED_LANGUAGES.find(language =>
      language.icons.some(icon => icon.matcher.test(file.toLowerCase())),
    )?.id ?? 'plain-text'
  );
}

export function parseArgs(argv: string[]) {
  let parsed;
  try {
    parsed = parseNodeArgs({
      args: argv,
      allowPositionals: true,
      options: {
        lang: {type: 'string'},
        lines: {type: 'string'},
        theme: {type: 'string'},
        preset: {type: 'string'},
        format: {type: 'string'},
        scale: {type: 'string'},
        output: {type: 'string', short: 'o'},
        help: {type: 'boolean', short: 'h'},
      },
    });
  } catch (error) {
    throw new UsageError(
      error instanceof Error ? error.message : String(error),
    );
  }
  const {values, positionals: files} = parsed;
  if (values.help) return {kind: 'help'} as const;

  const format = values.format ?? 'png';
  if (
    format !== 'png' &&
    format !== 'jpeg' &&
    format !== 'webp' &&
    format !== 'svg'
  ) {
    throw new UsageError('--format: expected png, jpeg, webp, or svg');
  }
  const scale = Number(values.scale ?? 1);
  if (!Number.isFinite(scale) || scale <= 0) {
    throw new UsageError('--scale: expected a positive finite number');
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
      throw new UsageError(
        '--lines: expected an inclusive range such as 10-30',
      );
    }
    lines = {start, end};
  }
  if (values.output === '') throw new UsageError('-o: expected a path or -');
  if (values.preset === '')
    throw new UsageError('--preset: expected a JSON file path');
  if (files.filter(file => file === '-').length > 1) {
    throw new UsageError('input: stdin (-) can only be read once');
  }
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
  } as const;
}

export type RenderArgs = Extract<
  ReturnType<typeof parseArgs>,
  {kind: 'render'}
>;
