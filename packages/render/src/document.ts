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
    signature: z
      .object({
        handle: z.string(),
        position: z.enum(['bottom-left', 'bottom-right']),
      })
      .nullable()
      .optional(),
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

const exportSize = {
  scale: z.number().finite().positive().max(3).default(2),
  width: z.number().finite().int().min(1).max(1920).optional(),
};

export const snapshotDocumentSchema = projectSnapshotSchema.extend({
  format: z.enum(['png', 'jpeg', 'webp', 'svg']).default('png'),
  ...exportSize,
});

// The timing of a project that stores no `animation`.
export const ANIMATION_DEFAULTS = {
  holdMs: 800,
  transitionMs: 900,
  easing: 'smooth',
  fps: 30,
} as const;

// Takumi plays scenes of whole milliseconds.
const durationMs = z.number().finite().nonnegative().transform(Math.round);

const animationStepSchema = z.looseObject({
  editorId: z.string(),
  holdMs: durationMs,
});

// The `animation` a project stores. A step is a tab, by its id.
export const animationSettingsSchema = z.looseObject({
  steps: z.tuple([animationStepSchema], animationStepSchema),
  transitionMs: durationMs,
  easing: z.enum(['smooth', 'snappy', 'linear']),
  fps: z.union([z.literal(24), z.literal(30), z.literal(50), z.literal(60)]),
});

export const animationDocumentSchema = projectSnapshotSchema
  .extend({
    animation: animationSettingsSchema.optional(),
    format: z.enum(['webp', 'gif', 'apng']).default('webp'),
    ...exportSize,
  })
  .transform(document => {
    const [first, ...rest] = document.editor.editors;
    const step = ({id}: typeof first) => ({
      editorId: id,
      holdMs: ANIMATION_DEFAULTS.holdMs,
    });
    const animation: AnimationSettings = document.animation ?? {
      ...ANIMATION_DEFAULTS,
      steps: [step(first), ...rest.map(step)],
    };
    return {...document, animation};
  })
  .superRefine(({animation, editor}, context) => {
    for (const [index, {editorId}] of animation.steps.entries()) {
      if (!editor.editors.some(({id}) => id === editorId)) {
        context.addIssue({
          code: 'custom',
          path: ['animation', 'steps', index, 'editorId'],
          message: `The snapshot has no tab ${JSON.stringify(editorId)}`,
        });
      }
    }
    const holdMs = animation.steps.reduce((sum, step) => sum + step.holdMs, 0);
    const transitions = animation.steps.length - 1;
    if (holdMs + transitions * animation.transitionMs === 0) {
      context.addIssue({
        code: 'custom',
        path: ['animation'],
        message: 'The holds and transitions add up to 0 ms',
      });
    }
  });

export type ProjectSnapshot = z.output<typeof projectSnapshotSchema>;
export type SnapshotDocument = z.output<typeof snapshotDocumentSchema>;
export type SnapshotInput = z.input<typeof snapshotDocumentSchema>;
export type AnimationSettings = z.output<typeof animationSettingsSchema>;
export type AnimationDocument = z.output<typeof animationDocumentSchema>;
export type AnimationInput = z.input<typeof animationDocumentSchema>;

function parseDocument<Document extends ProjectSnapshot & {scale: number}>(
  schema: z.ZodType<Document>,
  input: unknown,
): Document {
  const result = schema.safeParse(input);
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

export const parseSnapshotDocument = (input: unknown): SnapshotDocument =>
  parseDocument(snapshotDocumentSchema, input);

// Without `animation`, every tab is a step, in tab order.
export const parseAnimationDocument = (input: unknown): AnimationDocument =>
  parseDocument(animationDocumentSchema, input);
