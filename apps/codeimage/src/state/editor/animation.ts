import type {AnimationSettings, NonEmpty} from '@core/animation/model';
import {Subject, map} from 'rxjs';
import {createEffect, createMemo, createSignal, on, untrack} from 'solid-js';
import type {createEditorsStore} from './editor';

export const ANIMATION_DEFAULTS = {
  holdMs: 800,
  transitionMs: 900,
  easing: 'smooth',
  fps: 30,
} as const;

// Takumi rejects a fractional `timeMs`, so every duration is a whole number
// of milliseconds.
export const DURATION_LIMITS = {
  holdMs: {min: 0, max: 10_000},
  transitionMs: {min: 100, max: 5_000},
} as const;

export const EASINGS = [
  'smooth',
  'snappy',
  'linear',
] as const satisfies readonly AnimationSettings['easing'][];

export const FRAME_RATES = [
  24, 30, 50, 60,
] as const satisfies readonly AnimationSettings['fps'][];

type AnimationStep = AnimationSettings['steps'][number];

// Settings whose steps may name tabs that no longer exist, or miss new ones.
type AnimationDraft = Omit<AnimationSettings, 'steps'> & {
  steps: readonly AnimationStep[];
};

const EMPTY_DRAFT: AnimationDraft = {
  steps: [],
  transitionMs: ANIMATION_DEFAULTS.transitionMs,
  easing: ANIMATION_DEFAULTS.easing,
  fps: ANIMATION_DEFAULTS.fps,
};

const clampDuration = (
  value: number,
  {min, max}: {readonly min: number; readonly max: number},
) => Math.min(max, Math.max(min, Math.round(value)));

export const totalDurationMs = ({steps, transitionMs}: AnimationSettings) =>
  steps.reduce((total, step) => total + step.holdMs, 0) +
  (steps.length - 1) * transitionMs;

// Where each step's hold starts on the timeline.
export const stepStartsMs = ({steps, transitionMs}: AnimationSettings) =>
  steps.map((_, index) =>
    steps
      .slice(0, index)
      .reduce((start, step) => start + step.holdMs + transitionMs, 0),
  );

// Keeps the steps whose tab still exists, in their order, and appends a step
// for every other tab in tab order. A timeline of 0 ms has no frame to show,
// so a lone step held for 0 ms takes the default hold.
export function reconcileSteps(
  draft: AnimationDraft,
  editorIds: NonEmpty<string>,
): AnimationSettings {
  const tabs = new Set(editorIds);
  const kept = new Map<string, AnimationStep>();
  for (const step of draft.steps) {
    if (tabs.has(step.editorId) && !kept.has(step.editorId)) {
      kept.set(step.editorId, step);
    }
  }
  const added = editorIds
    .filter(editorId => !kept.has(editorId))
    .map(editorId => ({editorId, holdMs: ANIMATION_DEFAULTS.holdMs}));
  const [first, ...rest] = [...kept.values(), ...added] as [
    AnimationStep,
    ...AnimationStep[],
  ];
  const settings = {...draft, steps: [first, ...rest] as const};
  return totalDurationMs(settings) > 0
    ? settings
    : {...settings, steps: [{...first, holdMs: ANIMATION_DEFAULTS.holdMs}]};
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const includes = <T>(values: readonly T[], value: unknown): value is T =>
  values.includes(value as T);

// Reads settings saved by any version of the app, field by field. A field
// that is missing or invalid takes its default, and durations are rounded
// and clamped.
function parseDraft(value: unknown): AnimationDraft {
  if (!isRecord(value)) return EMPTY_DRAFT;
  const steps = Array.isArray(value.steps) ? value.steps : [];
  return {
    steps: steps.flatMap(step =>
      isRecord(step) &&
      typeof step.editorId === 'string' &&
      typeof step.holdMs === 'number' &&
      Number.isFinite(step.holdMs)
        ? [
            {
              editorId: step.editorId,
              holdMs: clampDuration(step.holdMs, DURATION_LIMITS.holdMs),
            },
          ]
        : [],
    ),
    transitionMs:
      typeof value.transitionMs === 'number' &&
      Number.isFinite(value.transitionMs)
        ? clampDuration(value.transitionMs, DURATION_LIMITS.transitionMs)
        : EMPTY_DRAFT.transitionMs,
    easing: includes(EASINGS, value.easing) ? value.easing : EMPTY_DRAFT.easing,
    fps: includes(FRAME_RATES, value.fps) ? value.fps : EMPTY_DRAFT.fps,
  };
}

export const parseAnimationSettings = (
  value: unknown,
  editorIds: NonEmpty<string>,
): AnimationSettings => reconcileSteps(parseDraft(value), editorIds);

// `playing` stores the clock time at which the playhead was at 0, so the
// playhead moves without an update per frame.
export type Playback =
  | {state: 'editing'}
  | {state: 'playing'; originMs: number}
  | {state: 'paused'; atMs: number}
  | {state: 'scrubbing'; atMs: number};

export type PlaybackEvent =
  | {type: 'play'; now: number}
  | {type: 'pause'; now: number}
  | {type: 'toggle'; now: number}
  // Drags the playhead. `seek` leaves it paused there.
  | {type: 'scrub'; atMs: number}
  | {type: 'seek'; atMs: number}
  | {type: 'edit'};

export function playheadMs(
  playback: Playback,
  now: number,
  durationMs: number,
): number {
  const at =
    playback.state === 'editing'
      ? 0
      : playback.state === 'playing'
        ? now - playback.originMs
        : playback.atMs;
  return Math.min(durationMs, Math.max(0, at));
}

export function nextPlayback(
  playback: Playback,
  event: PlaybackEvent,
  durationMs: number,
): Playback {
  switch (event.type) {
    case 'play': {
      if (playback.state === 'playing') return playback;
      const at = playheadMs(playback, event.now, durationMs);
      const from = playback.state === 'editing' || at >= durationMs ? 0 : at;
      return {state: 'playing', originMs: event.now - from};
    }
    case 'pause':
      return playback.state === 'playing'
        ? {state: 'paused', atMs: playheadMs(playback, event.now, durationMs)}
        : playback;
    case 'toggle':
      return nextPlayback(
        playback,
        {type: playback.state === 'playing' ? 'pause' : 'play', now: event.now},
        durationMs,
      );
    case 'scrub':
    case 'seek':
      return {
        state: event.type === 'scrub' ? 'scrubbing' : 'paused',
        atMs: Math.min(durationMs, Math.max(0, event.atMs)),
      };
    case 'edit':
      return {state: 'editing'};
  }
}

export function createAnimationStore(
  editor: ReturnType<typeof createEditorsStore>,
) {
  // The editor always keeps at least one tab.
  const editorIds = createMemo(
    () => editor.state.editors.map(({id}) => id) as [string, ...string[]],
  );
  const [draft, setDraft] = createSignal<AnimationDraft>(EMPTY_DRAFT);
  const settings = createMemo(() => reconcileSteps(draft(), editorIds()));
  const durationMs = createMemo(() => totalDurationMs(settings()));
  const [playback, setPlayback] = createSignal<Playback>({state: 'editing'});
  const [open, setOpen] = createSignal(false);
  const changes = new Subject<void>();

  const update = (change: (settings: AnimationSettings) => AnimationDraft) => {
    setDraft(change(settings()));
    changes.next();
  };
  const send = (event: PlaybackEvent) =>
    setPlayback(playback => nextPlayback(playback, event, durationMs()));
  const edit = () => send({type: 'edit'});

  // Typing shows the tab's code again, never a half-moved token.
  createEffect(
    on(
      () => editor.state.editors.map(({code}) => code),
      () => {
        if (untrack(playback).state !== 'editing') edit();
      },
      {defer: true},
    ),
  );
  createEffect(() => {
    if (editorIds().length < 2) untrack(close);
  });

  function close() {
    setOpen(false);
    edit();
  }

  return {
    settings,
    durationMs,
    playback,
    open,
    stateToPersist: settings,
    stateToPersist$: changes.pipe(map(() => settings())),
    actions: {
      setOpen(value: boolean) {
        if (value) setOpen(true);
        else close();
      },
      setFromPersistedState(value: unknown) {
        setDraft(parseDraft(value));
      },
      moveStep(from: number, to: number) {
        update(settings => {
          const steps = [...settings.steps];
          const [step] = steps.splice(from, 1);
          steps.splice(to, 0, step);
          return {...settings, steps};
        });
      },
      setHoldMs(editorId: string, holdMs: number) {
        update(settings => ({
          ...settings,
          steps: settings.steps.map(step =>
            step.editorId === editorId
              ? {
                  ...step,
                  holdMs: clampDuration(holdMs, DURATION_LIMITS.holdMs),
                }
              : step,
          ),
        }));
      },
      setTransitionMs(transitionMs: number) {
        update(settings => ({
          ...settings,
          transitionMs: clampDuration(
            transitionMs,
            DURATION_LIMITS.transitionMs,
          ),
        }));
      },
      setEasing(easing: AnimationSettings['easing']) {
        update(settings => ({...settings, easing}));
      },
      setFps(fps: AnimationSettings['fps']) {
        update(settings => ({...settings, fps}));
      },
      play: () => send({type: 'play', now: performance.now()}),
      pause: () => send({type: 'pause', now: performance.now()}),
      toggle: () => send({type: 'toggle', now: performance.now()}),
      scrub: (atMs: number) => send({type: 'scrub', atMs}),
      seek: (atMs: number) => send({type: 'seek', atMs}),
      edit,
    },
  } as const;
}
