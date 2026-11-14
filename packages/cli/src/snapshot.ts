import {basename} from 'node:path';
import {z} from 'zod';
import appPackage from '../../../apps/codeimage/package.json';
import {inferLanguage, resolveTheme, UsageError} from './args';
import type {RenderArgs} from './args';

const presetSchema = z.object({
  appVersion: z.string().min(1),
  frame: z.object({
    background: z.string(),
    padding: z.number().nonnegative(),
    radius: z.number().nonnegative(),
    visible: z.boolean(),
    opacity: z.number().min(0).max(100),
  }),
  terminal: z.object({
    showHeader: z.boolean(),
    type: z.enum(['macOs', 'macOsGrayTheme', 'macOsOutlineTheme', 'windows']),
    accentVisible: z.boolean(),
    shadow: z.string().nullable(),
    background: z.string(),
    textColor: z.string(),
    showWatermark: z.boolean(),
    showGlassReflection: z.boolean(),
    opacity: z.number().min(0).max(100),
    alternativeTheme: z.boolean(),
    borderType: z.literal('glass').nullable(),
  }),
  editor: z.object({
    fontId: z.string().min(1),
    fontWeight: z.number().positive(),
    showLineNumbers: z.boolean(),
    themeId: z
      .string()
      .transform(id => (id === 'fleetTheme' ? 'fleetDark' : id)),
    enableLigatures: z.boolean(),
  }),
});

export function parsePreset(text: string) {
  try {
    const preset = presetSchema.parse(JSON.parse(text));
    resolveTheme(preset.editor.themeId, '--preset editor.themeId');
    return preset;
  } catch (error) {
    throw new UsageError(
      `--preset: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

export type CodeInput = {name: string; code: string};

export async function buildSnapshot({
  args,
  inputs,
  preset,
}: {
  args: RenderArgs;
  inputs: CodeInput[];
  preset?: ReturnType<typeof parsePreset>;
}) {
  if (inputs.length === 0)
    throw new UsageError('input: provide a file or pipe code through stdin');
  const theme = await resolveTheme(
    args.theme ?? preset?.editor.themeId ?? 'fleetDark',
  ).load();
  const useThemeColors = args.theme !== undefined || !preset;
  const editors = inputs.map(({name, code}, index) => {
    if (args.lines) {
      const lines = code.replace(/\r\n?/g, '\n').split('\n');
      if (lines.at(-1) === '') lines.pop();
      if (args.lines.start > lines.length) {
        throw new UsageError(`--lines: ${name} has only ${lines.length} lines`);
      }
      code = lines.slice(args.lines.start - 1, args.lines.end).join('\n');
    }
    return {
      id: `cli-${index + 1}`,
      code,
      tabName: basename(name),
      languageId: args.language ?? inferLanguage(name),
      lineNumberStart: args.lines?.start ?? 1,
    };
  });
  return {
    $snippetId: null,
    $version: appPackage.version,
    frame: {
      padding: 64,
      radius: 8,
      visible: true,
      opacity: 100,
      ...preset?.frame,
      background: useThemeColors
        ? theme.properties.previewBackground
        : preset.frame.background,
    },
    terminal: {
      showHeader: true,
      type: 'macOs',
      accentVisible: true,
      shadow: 'rgba(0, 0, 0, 0.45) 0px 25px 20px -20px',
      showWatermark: true,
      showGlassReflection: false,
      opacity: 100,
      alternativeTheme: false,
      borderType: 'glass',
      ...preset?.terminal,
      background: useThemeColors
        ? theme.properties.terminal.main
        : preset.terminal.background,
      textColor: useThemeColors
        ? theme.properties.terminal.text
        : preset.terminal.textColor,
    },
    editor: {
      options: {
        fontId: 'jetbrains-mono',
        fontWeight: 400,
        enableLigatures: true,
        ...preset?.editor,
        themeId: theme.id,
        showLineNumbers:
          args.lines !== undefined || (preset?.editor.showLineNumbers ?? false),
      },
      editors,
    },
    format: args.format,
    scale: args.scale,
    width: 960,
  };
}
