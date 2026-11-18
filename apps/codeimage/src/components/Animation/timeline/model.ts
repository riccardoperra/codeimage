import {getEditorStore} from '@codeimage/store/editor';
import {
  transitionOf,
  type AnimationSegment,
  type SegmentSelection,
} from '@codeimage/store/editor/animationSettings';
import {projectStep} from '@core/animation/project';
import type {StepView} from '@core/animation/model';
import {useI18n} from '@codeimage/locale';
import type {AppLocaleEntries} from '../../../i18n';
export type StepSource = StepView & {editorId: string};
import {easingOf} from '@core/animation/easing';
import type {Easing, EasingValue} from '@core/animation/model';
import {createMemo, createSignal} from 'solid-js';

export type TimelineStep = {
  stepId: string;
  index: number;
  source: StepSource;
  editorId: string;
  tab: number;

  sub: number | null;
  hold: AnimationSegment;

  transition: AnimationSegment | null;
  easing: Easing;
  easingName: EasingValue;
  label: string;
  short: string;
  long: string;
};

export type TimelineTab = {
  editorId: string;
  position: number;
  name: string;
  steps: TimelineStep[];
};

export type HoverLink = {stepId: string; from: 'strip' | 'list'};

export type ListViewport = {element: HTMLElement; axis: 'x' | 'y'};

const FOLLOW_PAUSE_MS = 1500;

export const keyOf = (value: SegmentSelection) =>
  `${value.kind}:${value.stepId}`;

export function createTimelineModel() {
  const {animation, editor} = getEditorStore();
  const [t] = useI18n<AppLocaleEntries>();
  const describe = createStepDescription();
  const tabs = createMemo((): TimelineTab[] => {
    const settings = animation.settings();
    const segments = animation.segments();
    const out: TimelineTab[] = [];
    settings.steps.forEach((step, index) => {
      const source: StepSource = {
        ...(step.view ?? {kind: 'tab'}),
        editorId: step.editorId,
      };
      const tabIndex = editor.state.editors.findIndex(
        tab => tab.id === source.editorId,
      );
      const tab = editor.state.editors[tabIndex];
      let group = out.at(-1);
      if (group?.editorId !== source.editorId) {
        group = {
          editorId: source.editorId,
          position: tabIndex + 1,
          name: tab?.tab.tabName || t('animation.untitledTab'),
          steps: [],
        };
        out.push(group);
      }
      const projected = tab
        ? projectStep(tab, source)
        : {code: '', marks: {lines: [], focusedLines: []}};
      const hold = segments.find(
        segment => segment.kind === 'hold' && segment.stepId === step.id,
      );
      if (!hold) return;
      group.steps.push({
        stepId: step.id,
        index,
        source,
        editorId: source.editorId,
        tab: tabIndex + 1,
        sub: null,
        hold,
        transition:
          segments.find(
            segment =>
              segment.kind === 'transition' && segment.stepId === step.id,
          ) ?? null,
        easing: easingOf(transitionOf(settings, step).easing),
        easingName: transitionOf(settings, step).easing,
        label: '',
        ...describe(
          source,
          source.kind === 'tab' ? (tab?.code ?? '') : projected.code,
        ),
      });
    });
    for (const group of out) {
      const many = group.steps.length > 1;
      group.steps.forEach((step, index) => {
        step.sub = many ? index + 1 : null;
        step.label = many
          ? t('animation.timeline.tabStep', {
              tab: String(group.position),
              step: String(index + 1),
            })
          : t('animation.timeline.tabNumber', {n: String(group.position)});
      });
    }
    return out;
  });
  const steps = createMemo(() => tabs().flatMap(tab => tab.steps));
  const tabIds = createMemo(() => tabs().map(tab => tab.editorId), {
    equals: (a, b) => a.length === b.length && a.every((v, i) => v === b[i]),
  });
  const tabOf = (editorId: string) =>
    tabs().find(tab => tab.editorId === editorId);
  const stepOf = (stepId: string) =>
    steps().find(step => step.stepId === stepId);
  const stepIdsOf = (editorId: string) =>
    tabOf(editorId)?.steps.map(step => step.stepId) ?? [];
  const selected = (value: SegmentSelection) => {
    const current = animation.selection();
    return current?.stepId === value.stepId && current.kind === value.kind;
  };
  const playing = () => animation.playback().state !== 'editing';
  const isCurrent = (segment: AnimationSegment | null) =>
    !!segment &&
    playing() &&
    animation.playhead() >= segment.startMs &&
    animation.playhead() < segment.startMs + segment.durationMs;
  const progressOf = (segment: AnimationSegment | null) =>
    segment && isCurrent(segment)
      ? (animation.playhead() - segment.startMs) / segment.durationMs
      : 0;
  const [hover, setHover] = createSignal<HoverLink | null>(null);
  const [viewport, setViewport] = createSignal<ListViewport>();
  let userScrollAt = -Infinity;
  return {
    tabs,
    steps,
    hover,
    setHover,
    linked: (stepId: string) => hover()?.stepId === stepId,
    viewport,
    setViewport,
    markUserScroll: () => {
      userScrollAt = performance.now();
    },
    followPaused: () => performance.now() - userScrollAt < FOLLOW_PAUSE_MS,
    tabIds,
    tabOf,
    stepOf,
    stepIdsOf,
    selected,
    isCurrent,
    progressOf,
  };
}

export type TimelineModel = ReturnType<typeof createTimelineModel>;

export function projectedCode(step: TimelineStep) {
  const {editor} = getEditorStore();
  const tab = editor.state.editors.find(tab => tab.id === step.editorId);
  return tab ? projectStep(tab, step.source).code : '';
}

function createStepDescription() {
  const {editor} = getEditorStore();
  const [t] = useI18n<AppLocaleEntries>();
  return (source: StepSource, code: string) => {
    const count = String(code.split('\n').length);
    if (source.kind === 'tab')
      return {
        short: t('animation.timeline.lines', {n: count}),
        long: t('animation.timeline.lines', {n: count}),
      };
    const tab = editor.state.editors.find(tab => tab.id === source.editorId);
    if (source.kind === 'diff') {
      if (source.side === 'before')
        return {
          short: t('animation.timeline.before'),
          long: t('animation.timeline.before'),
        };
      const enters = (tab?.marks.lines ?? []).filter(
        line => line.kind === 'added',
      ).length;
      const leaves = (tab?.marks.lines ?? []).filter(
        line => line.kind === 'removed',
      ).length;
      return {
        short: `+${enters} −${leaves}`,
        long: t('animation.timeline.changes', {
          enter: String(enters),
          leave: String(leaves),
        }),
      };
    }
    const rules = tab?.marks.script?.lines ?? [];
    const enters = rules.filter(line => line.enter === source.step).length;
    const leaves = rules.filter(line => line.leave === source.step).length;
    const focus = rules.filter(line =>
      line.focus?.includes(source.step),
    ).length;
    const short = [
      enters || leaves ? `+${enters} −${leaves}` : '',
      focus ? t('animation.timeline.focusCount', {n: String(focus)}) : '',
    ]
      .filter(Boolean)
      .join(' · ');
    const long = [
      enters || leaves
        ? t('animation.timeline.changes', {
            enter: String(enters),
            leave: String(leaves),
          })
        : '',
      focus ? t('animation.timeline.focusCount', {n: String(focus)}) : '',
    ]
      .filter(Boolean)
      .join(' · ');
    return {
      short: short || t('animation.holdShort'),
      long: long || t('animation.timeline.lines', {n: count}),
    };
  };
}
