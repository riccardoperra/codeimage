import {parseSignature} from '../../../apps/codeimage/src/state/frame/model';
import {
  parseSurface,
  parseWindowType,
} from '../../../apps/codeimage/src/core/configuration/windowTypes';
import type {AnimationTiming} from '../../../apps/codeimage/src/render/contract';
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
    signature: z.unknown().optional().transform(parseSignature),
  }),
  terminal: z.looseObject({
    showHeader: z.boolean(),
    type: z.unknown().optional().transform(parseWindowType),
    surface: z.unknown().optional().transform(parseSurface),
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

// The Animate settings a project stores, read as the editor reads them
// (apps/codeimage/src/state/editor/animationSettings.ts, whose test checks
// this copy): values out of range are clamped and invalid ones fall back to
// the defaults, so a project plays here as it plays in the editor.
export const ANIMATION_DEFAULTS = {
  holdMs: 800,
  transitionMs: 700,
  easing: 'smooth',
  fps: 30,
} as const;
const DURATION_LIMITS = {
  holdMs: {min: 0, max: 10_000},
  transitionMs: {min: 100, max: 5_000},
} as const;
export const ANIMATION_FPS = [24, 30, 50, 60] as const;

export type AnimationEasing = AnimationTiming['easing'];
export type AnimationHeader = NonNullable<AnimationTiming['header']>;
export interface AnimationStepSettings {
  id: string;
  editorId: string;
  holdMs: number;
  // The transition that leads into this step, when it has its own.
  transition?: {ms: number; easing: AnimationEasing};
}
export interface AnimationSettings {
  steps: [AnimationStepSettings, ...AnimationStepSettings[]];
  transitionMs: number;
  easing: AnimationEasing;
  fps: (typeof ANIMATION_FPS)[number];
  header: AnimationHeader;
}

const EASING_CURVES = {
  smooth: [0.65, 0, 0.35, 1],
  snappy: [0.2, 0, 0, 1],
  strong: [0.77, 0, 0.175, 1],
  linear: [0, 0, 1, 1],
} as const;
type EasingName = keyof typeof EASING_CURVES;
const isEasingName = (value: string): value is EasingName =>
  Object.hasOwn(EASING_CURVES, value);
const formatPoint = (value: number) =>
  String(Number(Math.min(1, Math.max(0, value)).toFixed(3)));

// A preset name, or a cubic-bezier() with or without its function name.
export function parseEasing(text: string): AnimationEasing | null {
  const value = text.trim();
  if (isEasingName(value)) return value;
  const body =
    value.startsWith('cubic-bezier(') && value.endsWith(')')
      ? value.slice(13, -1)
      : value;
  const parts = body.split(',').map(part => part.trim());
  if (
    parts.length !== 4 ||
    parts.some(
      part => !/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(part),
    )
  )
    return null;
  const curve = parts.map(Number);
  const [x1, , x2] = curve;
  if (!curve.every(Number.isFinite) || x1 < 0 || x1 > 1 || x2 < 0 || x2 > 1)
    return null;
  const points = curve.map(point => Number(formatPoint(point)));
  for (const [name, preset] of Object.entries(EASING_CURVES)) {
    if (
      isEasingName(name) &&
      preset.every((point, index) => point === points[index])
    )
      return name;
  }
  return `cubic-bezier(${points.join(', ')})`;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;
const finite = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);
const clampDuration = (
  value: number,
  {min, max}: {readonly min: number; readonly max: number},
) => Math.min(max, Math.max(min, Math.round(value)));

function parseSteps(value: unknown): AnimationStepSettings[] {
  const used = new Set<string>();
  return (Array.isArray(value) ? value : []).flatMap(
    (step: unknown): AnimationStepSettings[] => {
      if (!isRecord(step) || typeof step.editorId !== 'string') return [];
      let id =
        typeof step.id === 'string' &&
        step.id.length > 0 &&
        step.id.length <= 64
          ? step.id
          : step.editorId;
      let suffix = 2;
      while (used.has(id)) id = `${step.editorId.slice(0, 55)}~${suffix++}`;
      used.add(id);
      const transition = isRecord(step.transition) ? step.transition : null;
      const easing =
        transition && typeof transition.easing === 'string'
          ? parseEasing(transition.easing)
          : null;
      return [
        {
          id,
          editorId: step.editorId,
          holdMs: finite(step.holdMs)
            ? clampDuration(step.holdMs, DURATION_LIMITS.holdMs)
            : ANIMATION_DEFAULTS.holdMs,
          ...(transition && finite(transition.ms) && easing
            ? {
                transition: {
                  ms: clampDuration(
                    transition.ms,
                    DURATION_LIMITS.transitionMs,
                  ),
                  easing,
                },
              }
            : {}),
        },
      ];
    },
  );
}

// Without stored steps every tab is a step, as when the Animate panel opens
// on such a project. A step whose tab is gone leaves the animation.
export function parseAnimationSettings(
  value: unknown,
  editorIds: readonly [string, ...string[]],
): AnimationSettings {
  const settings = isRecord(value) ? value : {};
  const stored = parseSteps(settings.steps);
  const tabs = new Set(editorIds);
  const kept = (
    stored.length
      ? stored
      : editorIds.map(editorId => ({
          id: editorId,
          editorId,
          holdMs: ANIMATION_DEFAULTS.holdMs,
        }))
  ).filter(step => tabs.has(step.editorId));
  const [
    first = {
      id: editorIds[0],
      editorId: editorIds[0],
      holdMs: ANIMATION_DEFAULTS.holdMs,
    },
    ...rest
  ] = kept;
  const header = isRecord(settings.header) ? settings.header : {};
  return {
    steps: [
      {
        ...first,
        holdMs:
          rest.length === 0 && first.holdMs === 0
            ? ANIMATION_DEFAULTS.holdMs
            : first.holdMs,
      },
      ...rest,
    ],
    transitionMs: finite(settings.transitionMs)
      ? clampDuration(settings.transitionMs, DURATION_LIMITS.transitionMs)
      : ANIMATION_DEFAULTS.transitionMs,
    easing:
      (typeof settings.easing === 'string'
        ? parseEasing(settings.easing)
        : null) ?? ANIMATION_DEFAULTS.easing,
    fps:
      ANIMATION_FPS.find(fps => fps === settings.fps) ?? ANIMATION_DEFAULTS.fps,
    header: {
      mode:
        header.mode === 'title' || header.mode === 'tabs' ? header.mode : 'tab',
      title:
        typeof header.title === 'string'
          ? header.title.trim().slice(0, 80)
          : '',
    },
  };
}

export const animationDocumentSchema = projectSnapshotSchema
  .extend({
    animation: z.unknown().optional(),
    format: z.enum(['webp', 'gif', 'apng']).default('webp'),
    ...exportSize,
  })
  .transform(document => {
    const [first, ...rest] = document.editor.editors;
    return {
      ...document,
      animation: parseAnimationSettings(document.animation, [
        first.id,
        ...rest.map(({id}) => id),
      ]),
    };
  });

export type ProjectSnapshot = z.output<typeof projectSnapshotSchema>;
export type SnapshotDocument = z.output<typeof snapshotDocumentSchema>;
export type SnapshotInput = z.input<typeof snapshotDocumentSchema>;
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

// Without stored steps, every tab is a step, in tab order.
export const parseAnimationDocument = (input: unknown): AnimationDocument =>
  parseDocument(animationDocumentSchema, input);
