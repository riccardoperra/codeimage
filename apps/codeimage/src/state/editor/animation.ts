import type {
  AnimationSettings,
  AnimationHeader,
  EasingValue,
} from '@core/animation/model';
import {Subject, map} from 'rxjs';
import {
  batch,
  createEffect,
  createMemo,
  createRoot,
  createSignal,
  getOwner,
  on,
  onCleanup,
  runWithOwner,
  untrack,
} from 'solid-js';
import type {createEditorsStore} from './editor';
import {
  ANIMATION_DEFAULTS,
  DURATION_LIMITS,
  EMPTY_DRAFT,
  clampDuration,
  parseDraft,
  reconcileSteps,
  seedSteps,
  segmentsOf,
  stepAt,
  totalDurationMs,
  transitionOf,
  type AnimationDraft,
  type SegmentSelection,
} from './animationSettings';

// `playing` keeps the clock time at which the playhead was at 0, so the
// state stays the same while the playhead moves.
export type Playback =
  | {state: 'editing'}
  | {state: 'playing'; originMs: number; untilMs?: number}
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
  return Math.min(
    playback.state === 'playing'
      ? (playback.untilMs ?? durationMs)
      : durationMs,
    Math.max(0, at),
  );
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
  editor: Pick<
    ReturnType<typeof createEditorsStore>,
    'activeEditorView' | 'activeEditorViewTabId'
  > & {
    state: Pick<
      ReturnType<typeof createEditorsStore>['state'],
      'editors' | 'activeEditorId'
    >;
    actions: Pick<
      ReturnType<typeof createEditorsStore>['actions'],
      'setActiveEditorId' | 'addEditor'
    >;
    computed: Pick<
      ReturnType<typeof createEditorsStore>['computed'],
      'canAddEditor'
    >;
  },
) {
  const owner = getOwner();
  const editorIds = createMemo(() => {
    const [first, ...rest] = editor.state.editors;
    return [first.id, ...rest.map(tab => tab.id)] as const;
  });
  const [draft, setDraft] = createSignal<AnimationDraft>(EMPTY_DRAFT);
  const settings = createMemo(() => reconcileSteps(draft(), editorIds()));
  const segments = createMemo(() => segmentsOf(settings()));
  const durationMs = createMemo(() => totalDurationMs(settings()));
  const [playback, setPlayback] = createSignal<Playback>({state: 'editing'});
  const [open, setOpen] = createSignal(false);
  const [selection, setSelection] = createSignal<SegmentSelection | null>(null);
  const [resizing, setResizing] = createSignal(false);
  const changes = new Subject<void>();
  let cancelFocus: (() => void) | undefined;
  onCleanup(() => changes.complete());
  const update = (
    change: (settings: AnimationSettings) => AnimationDraft,
    options: {commit?: boolean} = {},
  ) => {
    setDraft(change(settings()));
    if (options.commit !== false) changes.next();
  };
  const cancelEditingFocus = () => {
    cancelFocus?.();
    cancelFocus = undefined;
  };
  const send = (event: PlaybackEvent) => {
    cancelEditingFocus();
    setPlayback(playback => nextPlayback(playback, event, durationMs()));
  };
  const edit = () => send({type: 'edit'});
  const [now, setNow] = createSignal(0);
  createEffect(() => {
    const state = playback();
    if (state.state !== 'playing') return;
    let request = 0;
    const tick = (time: number) => {
      if (time - state.originMs >= (state.untilMs ?? durationMs()))
        send({type: 'pause', now: time});
      else {
        setNow(time);
        request = requestAnimationFrame(tick);
      }
    };
    setNow(performance.now());
    request = requestAnimationFrame(tick);
    onCleanup(() => cancelAnimationFrame(request));
  });
  const playhead = createMemo(() => {
    const state = playback();
    const at = playheadMs(state, now(), durationMs());
    if (state.state !== 'playing') return at;
    const frameMs = 1000 / settings().fps;
    return Math.floor(at / frameMs) * frameMs;
  });
  const currentStep = createMemo(() => stepAt(settings(), playhead()));
  onCleanup(() => cancelFocus?.());
  function editStep(index: number, text?: string) {
    const step = settings().steps[index];
    if (!step) return;
    edit();
    cancelFocus?.();
    editor.actions.setActiveEditorId(step.editorId);
    runWithOwner(owner, () =>
      createRoot(dispose => {
        cancelFocus = dispose;
        createEffect(() => {
          const view = editor.activeEditorView();
          if (
            !view ||
            editor.state.activeEditorId !== step.editorId ||
            editor.activeEditorViewTabId() !== step.editorId
          )
            return;
          view.focus();
          if (text && !view.state.readOnly)
            view.dispatch(view.state.replaceSelection(text));
          dispose();
          cancelFocus = undefined;
        });
      }),
    );
  }
  createEffect(
    on(
      () => editor.state.editors.map(({code}) => code),
      () => {
        if (untrack(playback).state !== 'editing') edit();
      },
      {defer: true},
    ),
  );
  createEffect(
    on(
      editorIds,
      ids => {
        if (!untrack(draft).steps.length) return;
        const reconciled = reconcileSteps(untrack(draft), ids);
        if (
          JSON.stringify(reconciled.steps) !==
          JSON.stringify(untrack(draft).steps)
        )
          update(() => reconciled);
        const selected = untrack(selection);
        if (
          selected &&
          !reconciled.steps.some(step => step.id === selected.stepId)
        )
          setSelection(null);
      },
      {defer: true},
    ),
  );
  const stateToPersist = () =>
    draft().steps.length
      ? {...settings(), steps: [...settings().steps]}
      : undefined;
  const setHoldMs = (
    stepId: string,
    holdMs: number,
    options?: {commit?: boolean},
  ) => {
    if (!Number.isFinite(holdMs)) return;
    update(
      settings => ({
        ...settings,
        steps: settings.steps.map(step =>
          step.id === stepId
            ? {...step, holdMs: clampDuration(holdMs, DURATION_LIMITS.holdMs)}
            : step,
        ),
      }),
      options,
    );
  };
  const setTransition = (
    stepId: string,
    transition: {ms?: number; easing?: EasingValue},
    options?: {commit?: boolean},
  ) => {
    if (transition.ms !== undefined && !Number.isFinite(transition.ms)) return;
    update(
      settings => ({
        ...settings,
        steps: settings.steps.map(step =>
          step.id === stepId
            ? {
                ...step,
                transition: {
                  ...transitionOf(settings, step),
                  ...transition,
                  ...(transition.ms === undefined
                    ? {}
                    : {
                        ms: clampDuration(
                          transition.ms,
                          DURATION_LIMITS.transitionMs,
                        ),
                      }),
                },
              }
            : step,
        ),
      }),
      options,
    );
  };
  const select = (value: SegmentSelection | null) => {
    setSelection(value);
    if (value?.kind === 'hold' && playback().state === 'editing') {
      const step = settings().steps.find(step => step.id === value.stepId);
      if (step) editor.actions.setActiveEditorId(step.editorId);
    }
  };
  return {
    settings,
    segments,
    durationMs,
    playback,
    playhead,
    currentStep,
    open,
    selection,
    resizing,
    stateToPersist,
    stateToPersist$: changes.pipe(map(stateToPersist)),
    actions: {
      setOpen(value: boolean) {
        batch(() => {
          if (value && !draft().steps.length)
            update(settings => ({...settings, steps: seedSteps(editorIds())}));
          setOpen(value);
          if (!value) {
            edit();
            setSelection(null);
          }
        });
      },
      setFromPersistedState(value: unknown) {
        setDraft(parseDraft(value));
        setSelection(null);
        edit();
      },
      select,
      setResizing,
      setHoldMs,
      setTransition,
      editStep,
      addStep(editorId: string) {
        if (!editorIds().includes(editorId)) return;
        const id = crypto.randomUUID();
        update(settings => ({
          ...settings,
          steps: [
            ...settings.steps,
            {id, editorId, holdMs: ANIMATION_DEFAULTS.holdMs},
          ],
        }));
        select({stepId: id, kind: 'hold'});
      },
      duplicateAsNext(stepId: string) {
        const index = settings().steps.findIndex(step => step.id === stepId);
        const step = settings().steps[index];
        const tab = editor.state.editors.find(tab => tab.id === step?.editorId);
        if (!tab || !editor.computed.canAddEditor()) return;
        batch(() => {
          editor.actions.addEditor(
            {
              ...tab,
              marks: {
                lines: tab.marks.lines.map(mark => ({...mark})),
                focusedLines: [...tab.marks.focusedLines],
              },
            },
            true,
          );
          const editorId = editor.state.editors.at(-1)!.id;
          const id = crypto.randomUUID();
          update(settings => {
            const steps = [...settings.steps];
            steps.splice(index + 1, 0, {id, editorId, holdMs: step.holdMs});
            return {...settings, steps};
          });
          select({stepId: id, kind: 'hold'});
          editStep(index + 1);
        });
      },
      removeStep(stepId: string) {
        if (settings().steps.length === 1) return;
        batch(() => {
          if (selection()?.stepId === stepId) setSelection(null);
          update(settings => ({
            ...settings,
            steps: settings.steps.filter(step => step.id !== stepId),
          }));
        });
      },
      moveStep(stepId: string, direction: -1 | 1) {
        const index = settings().steps.findIndex(step => step.id === stepId);
        const to = index + direction;
        if (index < 0 || to < 0 || to >= settings().steps.length) return;
        update(settings => {
          const steps = [...settings.steps];
          [steps[index], steps[to]] = [steps[to], steps[index]];
          return {...settings, steps};
        });
      },
      applyToAll(stepId: string) {
        const step = settings().steps.find(step => step.id === stepId);
        if (!step) return;
        const {ms, easing} = transitionOf(settings(), step);
        update(settings => ({
          ...settings,
          transitionMs: ms,
          easing,
          steps: settings.steps.map(({transition: _, ...step}) => step),
        }));
      },
      setFps(fps: AnimationSettings['fps']) {
        update(settings => ({...settings, fps}));
      },
      setHeader(header: Partial<AnimationHeader>) {
        update(settings => ({
          ...settings,
          header: {
            ...settings.header,
            ...header,
            ...(header.title === undefined
              ? {}
              : {title: header.title.trim().slice(0, 80)}),
          },
        }));
      },
      playTransition(stepId: string) {
        cancelEditingFocus();
        const segment = segments().find(
          segment => segment.kind === 'transition' && segment.stepId === stepId,
        );
        if (!segment) return;
        setPlayback({
          state: 'playing',
          originMs: performance.now() - Math.max(0, segment.startMs - 300),
          untilMs: segment.startMs + segment.durationMs,
        });
      },
      toggle: () => {
        if (settings().steps.length >= 2)
          send({type: 'toggle', now: performance.now()});
      },
      scrub: (atMs: number) => send({type: 'scrub', atMs}),
      seek: (atMs: number) => send({type: 'seek', atMs}),
      edit,
    },
  } as const;
}
