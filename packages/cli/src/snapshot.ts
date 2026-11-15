import {inferLanguageFromPath} from '@codeimage/config';
import {basename} from 'node:path';
import {z} from 'zod';
import {resolveTheme, UsageError} from './args';
import {formatIssues} from './errors';
import type {RenderArgs} from './args';
import {
  projectSnapshotSchema,
  SUPPORTED_SNAPSHOT_MAJOR,
} from '@codeimage/render';
import type {SnapshotDocument} from '@codeimage/render';

const presetSchema = z.looseObject({
  frame: projectSnapshotSchema.shape.frame,
  terminal: projectSnapshotSchema.shape.terminal,
  editor: projectSnapshotSchema.shape.editor.shape.options,
  // The timing of --animate, checked by --animate only, so a still export
  // never fails on it.
  animation: z.unknown().optional(),
});

export type Preset = z.output<typeof presetSchema>;

export function parsePreset(text: string): Preset {
  let preset: Preset;
  try {
    preset = presetSchema.parse(JSON.parse(text));
  } catch (error) {
    const message =
      error instanceof z.ZodError
        ? formatIssues(error.issues)
        : error instanceof Error
          ? error.message
          : String(error);
    throw new UsageError(`--preset: ${message}`);
  }
  const themeId =
    preset.editor.themeId === 'fleetTheme'
      ? 'fleetDark'
      : preset.editor.themeId;
  resolveTheme(themeId, '--preset editor.themeId');
  return {...preset, editor: {...preset.editor, themeId}};
}

export type CodeInput = {
  name: string;
  code: string;
  marks?: SnapshotDocument['editor']['editors'][number]['marks'];
};

export async function buildSnapshot({
  args,
  inputs,
  preset,
}: {
  args: RenderArgs;
  inputs: CodeInput[];
  preset?: Preset;
}): Promise<SnapshotDocument> {
  if (inputs.length === 0)
    throw new UsageError('no input: give a file or pipe code through stdin');
  const theme = await resolveTheme(
    args.theme ?? preset?.editor.themeId ?? 'fleetDark',
  ).load();
  const colors =
    args.theme !== undefined || !preset
      ? {
          frame: theme.properties.previewBackground,
          terminal: theme.properties.terminal.main,
          text: theme.properties.terminal.text,
        }
      : {
          frame: preset.frame.background,
          terminal: preset.terminal.background,
          text: preset.terminal.textColor,
        };
  const editors = inputs.map(({name, code, marks}, index) => {
    const range = args.lines;
    if (range) {
      const lines = code.replace(/\r\n?/g, '\n').split('\n');
      if (lines.at(-1) === '') lines.pop();
      if (range.start > lines.length) {
        throw new UsageError(`--lines: ${name} has only ${lines.length} lines`);
      }
      code = lines.slice(range.start - 1, range.end).join('\n');
      if (marks) {
        marks = {
          ...marks,
          focusedLines: marks.focusedLines
            .filter(line => line >= range.start && line <= range.end)
            .map(line => line - range.start + 1),
          lines: marks.lines
            .filter(mark => mark.line >= range.start && mark.line <= range.end)
            .map(mark => ({...mark, line: mark.line - range.start + 1})),
        };
      }
    }
    return {
      id: `cli-${index + 1}`,
      code,
      tabName: basename(name),
      languageId: args.language ?? inferLanguageFromPath(name) ?? 'plain-text',
      lineNumberStart: args.lines?.start ?? 1,
      ...(marks && {marks}),
    };
  });
  return {
    $snippetId: null,
    $version: `${SUPPORTED_SNAPSHOT_MAJOR}.0.0`,
    frame: {
      padding: 64,
      radius: 8,
      visible: true,
      opacity: 100,
      signature: null,
      ...preset?.frame,
      background: colors.frame,
    },
    terminal: {
      showHeader: true,
      type: 'macOs',
      surface: 'solid',
      accentVisible: true,
      shadow: 'rgba(0, 0, 0, 0.45) 0px 25px 20px -20px',
      showWatermark: true,
      showGlassReflection: false,
      opacity: 100,
      alternativeTheme: false,
      borderType: 'glass',
      ...preset?.terminal,
      background: colors.terminal,
      textColor: colors.text,
    },
    editor: {
      options: {
        fontId: 'jetbrains-mono',
        fontWeight: 400,
        enableLigatures: true,
        ...preset?.editor,
        themeId: theme.id,
        showLineNumbers:
          args.lines !== undefined || preset?.editor.showLineNumbers === true,
      },
      editors,
    },
    format: args.format,
    scale: args.scale,
  };
}
