import {parseEasing} from '@core/animation/easing';
import type {
  AnimationSettings,
  AnimationStepSettings,
  NonEmpty,
} from '@core/animation/model';
import {transitionHalfMs} from '@core/animation/timeline';

export const ANIMATION_DEFAULTS = {
  holdMs: 800,
  transitionMs: 700,
  easing: 'smooth',
  fps: 30,
} as const;
export const DURATION_LIMITS = {
  holdMs: {min: 0, max: 10_000},
  transitionMs: {min: 100, max: 5_000},
} as const;
export const EASINGS = ['smooth', 'snappy', 'strong', 'linear'] as const;
export const FRAME_RATES = [24, 30, 50, 60] as const;
export type AnimationDraft = Omit<AnimationSettings, 'steps'> & {
  steps: readonly AnimationStepSettings[];
};
export type SegmentSelection = {stepId: string; kind: 'hold' | 'transition'};
export type AnimationSegment = SegmentSelection & {
  index: number;
  startMs: number;
  durationMs: number;
};
export const EMPTY_DRAFT: AnimationDraft = {
  steps: [],
  transitionMs: 700,
  easing: 'smooth',
  fps: 30,
  header: {mode: 'tab', title: ''},
};
export const clampDuration = (
  value: number,
  {min, max}: {min: number; max: number},
) => Math.min(max, Math.max(min, Math.round(value)));
const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;
const finite = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

export function parseDraft(value: unknown): AnimationDraft {
  if (!isRecord(value)) return EMPTY_DRAFT;
  const used = new Set<string>();
  const steps = (Array.isArray(value.steps) ? value.steps : []).flatMap(
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
  const header = isRecord(value.header) ? value.header : {};
  return {
    steps,
    transitionMs: finite(value.transitionMs)
      ? clampDuration(value.transitionMs, DURATION_LIMITS.transitionMs)
      : 700,
    easing:
      typeof value.easing === 'string'
        ? (parseEasing(value.easing) ?? 'smooth')
        : 'smooth',
    fps:
      value.fps === 24 ||
      value.fps === 30 ||
      value.fps === 50 ||
      value.fps === 60
        ? value.fps
        : 30,
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

export const seedSteps = (editorIds: readonly string[]) =>
  editorIds.map(editorId => ({id: editorId, editorId, holdMs: 800}));
export function reconcileSteps(
  draft: AnimationDraft,
  editorIds: NonEmpty<string>,
): AnimationSettings {
  const tabs = new Set(editorIds);
  const kept = draft.steps.filter(step => tabs.has(step.editorId));
  const [
    first = {id: editorIds[0], editorId: editorIds[0], holdMs: 800},
    ...rest
  ] = kept;
  return {
    ...draft,
    steps: [
      {
        ...first,
        holdMs: rest.length === 0 && first.holdMs === 0 ? 800 : first.holdMs,
      },
      ...rest,
    ],
  };
}
export const parseAnimationSettings = (
  value: unknown,
  editorIds: NonEmpty<string>,
) => reconcileSteps(parseDraft(value), editorIds);
export const transitionOf = (
  settings: AnimationSettings,
  step: AnimationStepSettings,
) => step.transition ?? {ms: settings.transitionMs, easing: settings.easing};
export function segmentsOf(settings: AnimationSettings): AnimationSegment[] {
  let startMs = 0;
  return settings.steps.flatMap((step, index) => {
    const segments: AnimationSegment[] = [];
    if (index > 0) {
      const durationMs = transitionOf(settings, step).ms;
      segments.push({
        kind: 'transition',
        stepId: step.id,
        index,
        startMs,
        durationMs,
      });
      startMs += durationMs;
    }
    segments.push({
      kind: 'hold',
      stepId: step.id,
      index,
      startMs,
      durationMs: step.holdMs,
    });
    startMs += step.holdMs;
    return segments;
  });
}
export const totalDurationMs = (settings: AnimationSettings) =>
  segmentsOf(settings).reduce(
    (total, segment) => total + segment.durationMs,
    0,
  );
export function stepAt(settings: AnimationSettings, ms: number): number {
  for (const segment of segmentsOf(settings)) {
    if (ms < segment.startMs + segment.durationMs)
      return segment.kind === 'hold' ||
        ms - segment.startMs >= transitionHalfMs(segment.durationMs)
        ? segment.index
        : segment.index - 1;
  }
  return settings.steps.length - 1;
}
