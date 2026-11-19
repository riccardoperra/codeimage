import {parseEasing} from '@core/animation/easing';
import type {
  AnimationSettings,
  AnimationStepSettings,
  NonEmpty,
  StepView,
} from '@core/animation/model';
import type {EditorState} from './model';
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
  transitionMs: ANIMATION_DEFAULTS.transitionMs,
  easing: ANIMATION_DEFAULTS.easing,
  fps: ANIMATION_DEFAULTS.fps,
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

function parseView(value: unknown): StepView | undefined {
  if (!isRecord(value)) return;
  if (value.kind === 'tab') return {kind: 'tab'};
  if (
    value.kind === 'diff' &&
    (value.side === 'before' || value.side === 'after')
  )
    return {kind: 'diff', side: value.side};
  if (
    value.kind === 'script' &&
    typeof value.step === 'number' &&
    Number.isInteger(value.step) &&
    value.step >= 1
  )
    return {kind: 'script', step: value.step};
}

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
          ...(parseView(step.view) ? {view: parseView(step.view)} : {}),
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
      : ANIMATION_DEFAULTS.transitionMs,
    easing:
      typeof value.easing === 'string'
        ? (parseEasing(value.easing) ?? ANIMATION_DEFAULTS.easing)
        : ANIMATION_DEFAULTS.easing,
    fps:
      value.fps === 24 ||
      value.fps === 30 ||
      value.fps === 50 ||
      value.fps === 60
        ? value.fps
        : ANIMATION_DEFAULTS.fps,
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

type AnimationTab = Pick<EditorState, 'id' | 'marks'>;
export function deriveSteps(
  tabs: readonly AnimationTab[],
): AnimationStepSettings[] {
  return tabs.flatMap((tab): AnimationStepSettings[] => {
    const script = tab.marks.script;
    if (script)
      return script.steps.map((id, index) => ({
        id,
        editorId: tab.id,
        view: {kind: 'script', step: index + 1} satisfies StepView,
        holdMs: ANIMATION_DEFAULTS.holdMs,
      }));
    if (
      tab.marks.lines.some(
        mark => mark.kind === 'added' || mark.kind === 'removed',
      )
    )
      return (['before', 'after'] as const).map(side => ({
        id: `${tab.id}:${side}`,
        editorId: tab.id,
        view: {kind: 'diff', side} satisfies StepView,
        holdMs: ANIMATION_DEFAULTS.holdMs,
      }));
    return [
      {
        id: tab.id,
        editorId: tab.id,
        view: {kind: 'tab'} satisfies StepView,
        holdMs: ANIMATION_DEFAULTS.holdMs,
      },
    ];
  });
}
export function reconcileSteps(
  draft: AnimationDraft,
  tabs: NonEmpty<AnimationTab>,
): AnimationSettings {
  const timings = new Map(draft.steps.map(step => [step.id, step]));
  const [first, ...rest] = deriveSteps(tabs).map(step => {
    const saved = timings.get(step.id);
    return saved
      ? {
          ...step,
          holdMs: saved.holdMs,
          ...(saved.transition ? {transition: saved.transition} : {}),
        }
      : step;
  });
  return {
    ...draft,
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
  };
}
export const parseAnimationSettings = (
  value: unknown,
  tabs: NonEmpty<AnimationTab>,
) => reconcileSteps(parseDraft(value), tabs);
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

export const persistedAnimation = (state: AnimationSettings) => ({
  ...state,
  steps: [...state.steps],
});
