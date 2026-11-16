import {SUPPORTED_LANGUAGES} from '@codeimage/config';
import {snapshotDocumentSchema} from '@codeimage/render';
import {extname} from 'node:path';
import {parseArgs as parseNodeArgs} from 'node:util';
import {defineCommand} from 'citty';
import {THEME_REGISTRY} from '../../../apps/codeimage/src/state/theme/themeRegistry';
import {FLAGS} from './flags';
import type {FlagArg, FlagValues} from './flags';
import {parseAnimation} from './flags/animate';
import {UsageError} from './errors';
export {UsageError} from './errors';
import {parseFontArgs} from './commands/fonts';

const DEFAULT_SCALE = 1;

const CORE_ARGS = {
  output: {
    type: 'string',
    alias: 'o',
    valueHint: 'path',
    description:
      'Output file, or - for stdout (default: stdout when redirected, else codeimage.png)',
  },
  format: {
    type: 'string',
    valueHint: 'type',
    description:
      'png, jpeg, webp, or svg (default: from -o, else png). With --animate: mp4, webp, gif, or apng',
  },
  ffmpeg: {
    type: 'string',
    valueHint: 'path',
    description:
      'ffmpeg executable with libx264 for MP4 (default: CODEIMAGE_FFMPEG, PATH)',
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
} as const;

const ARGS: Record<string, FlagArg> = Object.assign(
  {},
  CORE_ARGS,
  ...FLAGS.map(flag => flag.args),
);

export const COMMAND = defineCommand({
  meta: {name: 'codeimage', description: 'Render code as an image'},
  args: {
    'file...': {
      type: 'positional',
      required: false,
      description:
        'Each file becomes a tab. With no files, or with -, read stdin',
    },
    ...ARGS,
  },
});

const OPTIONS = Object.fromEntries(
  Object.entries(ARGS).map(([name, {alias, ...arg}]) => [
    name,
    alias ? {...arg, short: alias} : arg,
  ]),
) as typeof CORE_ARGS;

const FORMATS = snapshotDocumentSchema.shape.format.unwrap().options;

function formatOf(name: string) {
  return FORMATS.find(format => format === (name === 'jpg' ? 'jpeg' : name));
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

export function parseArgs(argv: string[], stdoutIsTTY = true) {
  if (argv[0] === 'fonts') return parseFontArgs(argv.slice(1));
  const parsed = readArguments(argv);
  const {values, positionals: files} = parsed;
  if (values.help) return {kind: 'help'} as const;

  if (values.output === '') throw new UsageError('-o: expected a path or -');
  const {mp4, animation, format} = parseOutput(values);
  const scale = validateValues(values);
  const lines = parseLines(values.lines);
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
    animation,
    mp4,
    ffmpeg: values.ffmpeg,
    scale,
    output:
      values.output ??
      (stdoutIsTTY
        ? `codeimage.${mp4 ? 'mp4' : (animation?.format ?? format)}`
        : '-'),
    values: values as FlagValues,
  } as const;
}

export type RenderArgs = Extract<
  ReturnType<typeof parseArgs>,
  {kind: 'render'}
>;

function readArguments(argv: string[]) {
  try {
    return parseNodeArgs({
      args: argv,
      allowPositionals: true,
      options: OPTIONS,
    });
  } catch (error) {
    throw new UsageError(
      error instanceof Error ? error.message : String(error),
    );
  }
}
type CoreValues = ReturnType<typeof readArguments>['values'];
function parseOutput(values: CoreValues) {
  const mp4 =
    'animate' in values &&
    values.animate === true &&
    (values.format?.toLowerCase() ??
      extname(values.output ?? '')
        .slice(1)
        .toLowerCase()) === 'mp4';
  const animation = parseAnimation(mp4 ? {...values, format: 'webp'} : values);
  if (values.ffmpeg !== undefined && (!mp4 || !values.ffmpeg.trim())) {
    throw new UsageError(
      '--ffmpeg: expected an executable path with --animate and MP4 output',
    );
  }
  let format: ReturnType<typeof formatOf>;
  if (animation) format = 'png';
  else if (values.format === undefined)
    format =
      formatOf(
        extname(values.output ?? '')
          .slice(1)
          .toLowerCase(),
      ) ?? 'png';
  else format = formatOf(values.format);
  if (!format) {
    throw new UsageError('--format: expected png, jpeg, webp, or svg');
  }

  return {mp4, animation, format};
}
function validateValues(values: CoreValues) {
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

  return scale;
}
function parseLines(value: string | undefined) {
  let lines: {start: number; end: number} | undefined;
  if (value !== undefined) {
    const match = /^([1-9]\d*)-([1-9]\d*)$/.exec(value);
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

  return lines;
}
