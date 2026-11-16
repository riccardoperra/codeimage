import type {AnimationTiming} from '../../../apps/codeimage/src/render/contract';

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
