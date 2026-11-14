// Mirror of packages/render/src/document.ts from P3. Replace this file with
// imports from @codeimage/render once it is a workspace package.
import {z} from 'zod';

export const SUPPORTED_SNAPSHOT_MAJOR = 1;

const versionSchema = z
  .string({
    error: issue =>
      `Unsupported snapshot $version ${JSON.stringify(issue.input)}`,
  })
  .superRefine((version, context) => {
    const match = /^(\d+)\.\d+\.\d+(?:-[\w.-]+)?(?:\+[\w.-]+)?$/.exec(version);
    if (!match || Number(match[1]) > SUPPORTED_SNAPSHOT_MAJOR) {
      context.addIssue({
        code: 'custom',
        message: `Unsupported snapshot $version ${JSON.stringify(version)}. Supported major is ${SUPPORTED_SNAPSHOT_MAJOR}.`,
      });
    }
  });

export const projectSnapshotSchema = z.looseObject({
  $snippetId: z.string().nullable(),
  $version: versionSchema,
  frame: z.looseObject({
    background: z.string().nullable(),
    padding: z.number().finite().nonnegative(),
    radius: z.number().finite().nonnegative(),
    visible: z.boolean(),
    opacity: z.number().min(0).max(100),
  }),
  terminal: z.looseObject({
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
    borderType: z.string().nullable(),
  }),
  editor: z.looseObject({
    options: z.looseObject({
      fontId: z.string(),
      fontWeight: z.number().int().min(1).max(1000),
      showLineNumbers: z.boolean(),
      themeId: z.string(),
      enableLigatures: z.boolean(),
    }),
    editors: z
      .array(
        z.looseObject({
          id: z.string(),
          code: z.string(),
          tabName: z.string(),
          languageId: z.string(),
          lineNumberStart: z.number().int().positive(),
        }),
      )
      .min(1, 'A snapshot needs at least one editor'),
  }),
});

export const snapshotDocumentSchema = projectSnapshotSchema.extend({
  format: z.enum(['png', 'jpeg', 'webp', 'svg']).default('png'),
  scale: z.number().finite().positive().max(3).default(2),
  width: z.number().finite().int().min(1).max(1920).default(960),
});

export type SnapshotDocument = z.output<typeof snapshotDocumentSchema>;
export type SnapshotInput = z.input<typeof snapshotDocumentSchema>;
