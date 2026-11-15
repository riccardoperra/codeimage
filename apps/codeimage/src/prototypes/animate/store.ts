import {getEditorStore} from '@codeimage/store/editor';
import {
  nextPlayback,
  type Playback,
  type PlaybackEvent,
  playheadMs,
} from '@codeimage/store/editor/animation';
import type {EasingCurve} from '@core/animation/model';
import {
  batch,
  createEffect,
  createMemo,
  createRoot,
  createSignal,
  on,
  onCleanup,
  untrack,
} from 'solid-js';
import {DEMO_TABS} from './demo';

export type PresetId = 'smooth' | 'snappy' | 'strong' | 'linear';

export const PRESETS: readonly {
  id: PresetId;
  label: string;
  curve: EasingCurve;
}[] = [
  {id: 'smooth', label: 'Smooth', curve: [0.65, 0, 0.35, 1]},
  {id: 'snappy', label: 'Snappy', curve: [0.2, 0, 0, 1]},
  {id: 'strong', label: 'Strong', curve: [0.77, 0, 0.175, 1]},
  {id: 'linear', label: 'Linear', curve: [0, 0, 1, 1]},
];

export type StepEasing =
  | {kind: 'preset'; id: PresetId}
  | {kind: 'custom'; curve: EasingCurve};

// A step points at a tab. Its id stays when steps move, so the same tab can
// appear twice (A → B → A). The transition is the one out of the step; the
// last step's is kept for when a step is added after it.
export type ProtoStep = {
  id: string;
  editorId: string;
  holdMs: number;
  transitionMs: number;
  easing: StepEasing;
};

export type SegmentKind = 'hold' | 'transition';

export type Segment = {
  key: string;
  stepId: string;
  step: number;
  kind: SegmentKind;
  startMs: number;
  durationMs: number;
};

export type Selection = {stepId: string; kind: SegmentKind};

export const LIMITS = {
  hold: {min: 0, max: 10_000},
  transition: {min: 100, max: 5_000},
} as const;

const clamp = (kind: SegmentKind, ms: number) =>
  Math.min(LIMITS[kind].max, Math.max(LIMITS[kind].min, Math.round(ms)));

export const curveOfStep = (easing: StepEasing): EasingCurve =>
  easing.kind === 'custom'
    ? easing.curve
    : PRESETS.find(preset => preset.id === easing.id)!.curve;

export const easingLabel = (easing: StepEasing) =>
  easing.kind === 'custom'
    ? 'Custom'
    : PRESETS.find(preset => preset.id === easing.id)!.label;

export const cssEasing = (easing: StepEasing) =>
  `cubic-bezier(${curveOfStep(easing).join(', ')})`;

// Reads `cubic-bezier(x1, y1, x2, y2)` or four bare numbers. x stays in
// [0, 1] as CSS requires, and y is clamped to [0, 1]: no overshoot.
export function parseCurve(text: string): EasingCurve | null {
  const inner = text
    .trim()
    .replace(/^cubic-bezier\s*\(/i, '')
    .replace(/\)\s*$/, '');
  const values = inner.split(/[\s,]+/).filter(Boolean).map(Number);
  if (values.length !== 4 || values.some(value => !Number.isFinite(value)))
    return null;
  const [x1, y1, x2, y2] = values;
  if (x1 < 0 || x1 > 1 || x2 < 0 || x2 > 1) return null;
  const y = (value: number) => Math.min(1, Math.max(0, value));
  return [x1, y(y1), x2, y(y2)];
}

export const formatCurve = (curve: EasingCurve) =>
  `cubic-bezier(${curve.map(value => Number(value.toFixed(3))).join(', ')})`;

export const formatMs = (ms: number) =>
  ms >= 1000 ? `${Number((ms / 1000).toFixed(2))} s` : `${Math.round(ms)} ms`;

const DEFAULT_HOLD_MS = 800;

let nextId = 0;
const stepId = () => `step-${++nextId}`;

function createAnimateStore() {
  const {editor} = getEditorStore();

  // A document with one tab has nothing to animate, so the prototype loads
  // the demo tabs. A document with more keeps its tabs.
  if (
    editor.state.editors.length < 2 ||
    new URLSearchParams(location.search).has('demo')
  ) {
    editor.actions.setFromPersistedState({
      options: {...editor.state.options},
      editors: DEMO_TABS.map(tab => ({
        ...tab,
        languageId: 'typescript',
        lineNumberStart: 1,
        marks: {lines: [], focusedLines: []},
      })),
    });
  }

  const [defaults, setDefaults] = createSignal<{
    transitionMs: number;
    easing: StepEasing;
  }>({transitionMs: 900, easing: {kind: 'preset', id: 'smooth'}});

  const newStep = (editorId: string): ProtoStep => ({
    id: stepId(),
    editorId,
    holdMs: DEFAULT_HOLD_MS,
    ...untrack(defaults),
  });

  const [steps, setSteps] = createSignal<ProtoStep[]>(
    editor.state.editors.slice(0, 3).map(tab => newStep(tab.id)),
  );

  // A step whose tab was closed leaves the animation.
  const liveSteps = createMemo(() => {
    const ids = new Set(editor.state.editors.map(tab => tab.id));
    return steps().filter(step => ids.has(step.editorId));
  });

  const segments = createMemo(() => {
    const list = liveSteps();
    const result: Segment[] = [];
    let at = 0;
    list.forEach((step, index) => {
      result.push({
        key: `${step.id}:hold`,
        stepId: step.id,
        step: index,
        kind: 'hold',
        startMs: at,
        durationMs: step.holdMs,
      });
      at += step.holdMs;
      if (index < list.length - 1) {
        result.push({
          key: `${step.id}:transition`,
          stepId: step.id,
          step: index,
          kind: 'transition',
          startMs: at,
          durationMs: step.transitionMs,
        });
        at += step.transitionMs;
      }
    });
    return result;
  });

  const durationMs = createMemo(() =>
    segments().reduce((total, segment) => total + segment.durationMs, 0),
  );

  const [playback, setPlayback] = createSignal<Playback>({state: 'editing'});
  const send = (event: PlaybackEvent) =>
    setPlayback(state => nextPlayback(state, event, durationMs()));

  const [now, setNow] = createSignal(0);
  createEffect(() => {
    const state = playback();
    if (state.state !== 'playing') return;
    let request = 0;
    const tick = (time: number) => {
      if (time - state.originMs >= durationMs()) {
        send({type: 'pause', now: time});
      } else {
        setNow(time);
        request = requestAnimationFrame(tick);
      }
    };
    setNow(performance.now());
    request = requestAnimationFrame(tick);
    onCleanup(() => cancelAnimationFrame(request));
  });
  const playhead = createMemo(() =>
    playheadMs(playback(), now(), durationMs()),
  );

  const segmentAt = (ms: number): Segment | undefined => {
    const list = segments();
    return (
      list.find(
        segment =>
          ms >= segment.startMs && ms < segment.startMs + segment.durationMs,
      ) ?? list.at(-1)
    );
  };

  // The step the playhead shows: a transition belongs to the step it leaves
  // in its first half and to the next one in its second, as the core plays it.
  const currentStep = createMemo(() => {
    const segment = segmentAt(playhead());
    if (!segment) return 0;
    if (segment.kind === 'hold') return segment.step;
    return playhead() - segment.startMs < segment.durationMs / 2
      ? segment.step
      : segment.step + 1;
  });

  const [selection, setSelection] = createSignal<Selection | null>(null);
  // While a segment's edge is dragged the preview keeps its last plan.
  const [dragging, setDragging] = createSignal(false);
  const selectedStep = () => {
    const selected = selection();
    return selected
      ? liveSteps().find(step => step.id === selected.stepId)
      : undefined;
  };

  // Typing shows the tab's code again, never a half-moved token. The
  // automatic edit mode keeps the playhead on the hold being edited.
  const [typingExits, setTypingExits] = createSignal(true);
  createEffect(
    on(
      () => editor.state.editors.map(({code}) => code),
      () => {
        if (untrack(playback).state !== 'editing' && untrack(typingExits))
          send({type: 'edit'});
      },
      {defer: true},
    ),
  );

  const update = (id: string, change: (step: ProtoStep) => ProtoStep) =>
    setSteps(list => list.map(step => (step.id === id ? change(step) : step)));

  const tabName = (editorId: string) =>
    editor.state.editors.find(tab => tab.id === editorId)?.tab.tabName ??
    'Untitled';

  return {
    steps: liveSteps,
    segments,
    durationMs,
    playback,
    playhead,
    currentStep,
    segmentAt,
    selection,
    selectedStep,
    dragging,
    setDragging,
    setTypingExits,
    defaults,
    tabName,
    tabs: () => editor.state.editors,
    actions: {
      select: setSelection,
      setDuration(selected: Selection, ms: number) {
        update(selected.stepId, step =>
          selected.kind === 'hold'
            ? {...step, holdMs: clamp('hold', ms)}
            : {...step, transitionMs: clamp('transition', ms)},
        );
      },
      setEasing(id: string, easing: StepEasing) {
        update(id, step => ({...step, easing}));
      },
      // Copies the duration and easing of one transition to every other one,
      // and makes them the default of steps added later.
      applyToAll(id: string) {
        const source = liveSteps().find(step => step.id === id);
        if (!source) return;
        const {transitionMs, easing} = source;
        batch(() => {
          setDefaults({transitionMs, easing});
          setSteps(list => list.map(step => ({...step, transitionMs, easing})));
        });
      },
      setDefaultTransition(transitionMs: number) {
        batch(() => {
          setDefaults(value => ({...value, transitionMs}));
          setSteps(list => list.map(step => ({...step, transitionMs})));
        });
      },
      addStep(editorId: string) {
        const step = newStep(editorId);
        setSteps(list => [...list, step]);
        setSelection({stepId: step.id, kind: 'hold'});
      },
      // A new tab with the step's code, as the step after it, ready to edit.
      duplicateAsNext(id: string) {
        const source = liveSteps().find(step => step.id === id);
        const tab = editor.state.editors.find(t => t.id === source?.editorId);
        if (!source || !tab || !editor.computed.canAddEditor()) return;
        const before = new Set(editor.state.editors.map(t => t.id));
        editor.actions.addEditor(
          {
            code: tab.code,
            languageId: tab.languageId,
            lineNumberStart: tab.lineNumberStart,
            marks: structuredClone(tab.marks),
            tab: {tabName: tab.tab.tabName},
          },
          true,
        );
        const created = editor.state.editors.find(t => !before.has(t.id));
        if (!created) return;
        const step = {...newStep(created.id), holdMs: source.holdMs};
        setSteps(list => {
          const index = list.findIndex(s => s.id === id);
          return [...list.slice(0, index + 1), step, ...list.slice(index + 1)];
        });
        setSelection({stepId: step.id, kind: 'hold'});
        send({type: 'edit'});
      },
      removeStep(id: string) {
        if (liveSteps().length <= 2) return;
        setSteps(list => list.filter(step => step.id !== id));
        setSelection(null);
      },
      moveStep(id: string, by: -1 | 1) {
        setSteps(list => {
          const index = list.findIndex(step => step.id === id);
          const to = index + by;
          if (index < 0 || to < 0 || to >= list.length) return list;
          const next = [...list];
          [next[index], next[to]] = [next[to], next[index]];
          return next;
        });
      },
      // Shows the tab of a step in the editor, out of the preview.
      editStep(index: number) {
        const step = liveSteps()[index];
        batch(() => {
          send({type: 'edit'});
          if (step) editor.actions.setActiveEditorId(step.editorId);
        });
      },
      play: () => send({type: 'play', now: performance.now()}),
      playFromStart() {
        send({type: 'seek', atMs: 0});
        send({type: 'play', now: performance.now()});
      },
      toggle: () => send({type: 'toggle', now: performance.now()}),
      scrub: (atMs: number) => send({type: 'scrub', atMs}),
      seek: (atMs: number) => send({type: 'seek', atMs}),
      edit: () => send({type: 'edit'}),
    },
  } as const;
}

export type AnimateStore = ReturnType<typeof createAnimateStore>;

// One store for the route, so switching variants keeps the steps. It needs
// the editor store, which is global, so it lives in its own root.
let store: AnimateStore | undefined;
export function getAnimateStore(): AnimateStore {
  if (!store) store = createRoot(() => createAnimateStore());
  return store;
}
