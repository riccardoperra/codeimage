import {parseSignature} from '../../../apps/codeimage/src/state/frame/model';
import {
  parseSurface,
  parseWindowType,
} from '../../../apps/codeimage/src/core/configuration/windowTypes';
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
    exportTarget: z
      .enum(['x-landscape', 'square', 'linkedin-portrait', 'open-graph'])
      .nullable()
      .optional(),
    aspectRatio: z.string().nullable().optional(),
    signature: z.unknown().transform(parseSignature),
  }),
  terminal: z.looseObject({
    showHeader: z.boolean(),
    type: z.unknown().transform(parseWindowType),
    surface: z.unknown().transform(parseSurface),
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
          marks: z
            .object({
              lines: z.array(
                z.object({
                  line: z.number().int().positive(),
                  kind: z.enum(['added', 'removed', 'highlight']),
                }),
              ),
              focusedLines: z.array(z.number().int().positive()).default([]),
            })
            .optional(),
        }),
      )
      .min(1, 'A snapshot needs at least one editor'),
  }),
});

export const snapshotDocumentSchema = projectSnapshotSchema.extend({
  format: z.enum(['png', 'jpeg', 'webp', 'svg']).default('png'),
  scale: z.number().finite().positive().max(3).default(2),
  width: z.number().finite().int().min(1).max(1920).optional(),
});

export type ProjectSnapshot = z.output<typeof projectSnapshotSchema>;
export type SnapshotDocument = z.output<typeof snapshotDocumentSchema>;
export type SnapshotInput = z.input<typeof snapshotDocumentSchema>;

export function parseSnapshotDocument(input: unknown): SnapshotDocument {
  const result = snapshotDocumentSchema.safeParse(input);
  // Like the web export, a named target is exactly its pixel size.
  if (result.success)
    return result.data.frame.exportTarget
      ? {...result.data, scale: 1}
      : result.data;
  throw new Error(
    result.error.issues
      .map(issue => `${issue.path.join('.')}: ${issue.message}`)
      .join('\n'),
    {cause: result.error},
  );
}
