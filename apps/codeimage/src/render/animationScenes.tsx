import {measureAnimationCode} from './animationMeasure';

import type {AnimationHost, AnimationScenes, AnimationTiming} from './contract';

import {clipFrameCount} from '@core/animation/clock';
import {easingOf} from '@core/animation/easing';
import {projectStep} from '@core/animation/project';

import {
  frameRules,
  planTimeline,
  timelineSize,
  type FrameSelectors,
  type TimelineStep,
} from '@core/animation/timeline';

import {loadLanguage, tokenizeCode} from '@core/snapshot/tokenize';

import {renderToStringAsync} from 'solid-js/web';

import AnimatedCodeView from '../components/CustomEditor/AnimatedCodeView';
import {
  AnimationCanvas,
  animationMatte,
} from '../components/Animation/AnimationCanvas';
import {staticThemeCss} from '../components/CustomEditor/staticTheme';
import * as styles from '../components/Frame/Frame.css';
import {findTab, loadFrame, renderBody, NO_MARKS} from './frameState';
import type {RenderSnapshot} from './frameState';
import {composeStep} from './composeFrame';
import type {ComposedStep} from './composeFrame';

import {page, SSR_OPTIONS, EXPORT_EXCLUDE_CSS} from './ssr';
const FRAME_SLOT = 'codeimage-animation-frame';

async function canvasMarkup(
  props: Omit<Parameters<typeof AnimationCanvas>[0], 'children'>,
): Promise<[string, string]> {
  const html = await renderToStringAsync(
    () => <AnimationCanvas {...props}>{FRAME_SLOT}</AnimationCanvas>,
    SSR_OPTIONS,
  );
  const [start, end, ...rest] = html.split(FRAME_SLOT);
  if (end === undefined || rest.length)
    throw new Error('The animation canvas lost its frame');
  return [start, end];
}

const sceneSelectors = (scene: number): FrameSelectors => ({
  frame: `[data-animation-scene="${scene}"] [data-snapshot-frame]`,
  window: `[data-animation-scene="${scene}"] [data-fitted-window]`,
});

const keepPadding = ({frame}: FrameSelectors) =>
  `${frame}{padding:${styles.frameVars.padding}!important}`;

function projectSteps(snapshot: RenderSnapshot, timing: AnimationTiming) {
  const tabs = timing.steps.map(step => {
    const tab = findTab(snapshot, step.editorId);
    return projectStep({...tab, marks: tab.marks ?? NO_MARKS}, step.view);
  });
  const stepSnapshot = (index: number): RenderSnapshot => ({
    ...snapshot,
    editor: {
      ...snapshot.editor,
      editors: snapshot.editor.editors.map(tab =>
        tab.id === tabs[index].id ? tabs[index] : tab,
      ),
    },
  });
  return {tabs, stepSnapshot};
}

export async function renderAnimationScenes(
  snapshot: RenderSnapshot,
  timing: AnimationTiming,
  host: AnimationHost,
): Promise<AnimationScenes> {
  const {tabs, stepSnapshot} = projectSteps(snapshot, timing);
  const [loaded, languages] = await Promise.all([
    loadFrame(snapshot, host),
    Promise.all(tabs.map(tab => loadLanguage(tab.languageId, tab.tabName))),
  ]);
  const {theme, fontName, appearance} = loaded;
  const {options} = snapshot.editor;

  const {metrics, widths} = await measureAnimationCode(
    snapshot,
    loaded,
    tabs,
    host,
  );

  const composeSteps = async (signatureWidth?: number) => {
    const composed = new Map<string, Promise<ComposedStep>>();
    const steps: ComposedStep[] = [];
    for (const [index, tab] of tabs.entries()) {
      const key = `${tab.id} ${JSON.stringify(timing.steps[index].view ?? {})}`;
      let step = composed.get(key);
      if (!step) {
        step = composeStep(stepSnapshot(index), loaded, host, {
          editorId: tab.id,
          language: languages[index],
          animation: {header: timing.header, signatureWidth},
        });
        composed.set(key, step);
      }
      steps.push(await step);
    }
    return steps;
  };

  let steps = await composeSteps();
  const signatureWidth = snapshot.frame.signature
    ? timelineSize(steps.map(({layout}) => layout)).width
    : undefined;
  if (signatureWidth !== undefined) steps = await composeSteps(signatureWidth);

  const timelineStep = (index: number): TimelineStep => {
    const {holdMs, transition} = timing.steps[index];
    return {
      lines: tokenizeCode(tabs[index].code, languages[index], theme),
      marks: tabs[index].marks,
      rows: tabs[index].rows,
      source: tabs[index].id,
      lineNumberStart: tabs[index].lineNumberStart,
      layout: steps[index].layout,
      holdMs,
      transition: transition && {
        ms: transition.ms,
        easing: easingOf(transition.easing),
      },
    };
  };
  const timeline = planTimeline(
    [
      timelineStep(0),
      ...tabs.slice(1).map((_, index) => timelineStep(index + 1)),
    ],
    {
      transitionMs: timing.transitionMs,
      easing: easingOf(timing.easing),
      fps: timing.fps,
      lineNumbers: options.showLineNumbers,
      metrics,
      widths,
    },
  );

  const [canvasStart, canvasEnd] = await canvasMarkup({
    width: timeline.width,
    height: timeline.height,
    matte: animationMatte(theme),
    frame: appearance,
    image: loaded.media.backgroundImage,
  });
  const css = [
    staticThemeCss(theme),
    EXPORT_EXCLUDE_CSS,

    `[data-animation-scene]{width:${timeline.width}px;height:${timeline.height}px}`,
    '[data-animation-scene] [data-watermark-background]{display:none!important}',
    timeline.css,
  ];
  const scenes: AnimationScenes['scenes'] = [];
  for (const [index, scene] of timeline.scenes.entries()) {
    const step = steps[scene.step];
    const tab = tabs[scene.step];
    const selectors = sceneSelectors(index);
    let body = step.body;
    if (scene.kind === 'hold') {
      css.push(
        frameRules(
          {...scene, frame: {...scene.frame, window: null}},
          selectors,
        ),
      );
    } else {
      body = await renderBody(stepSnapshot(scene.step), loaded, {
        appearance,
        editorId: tab.id,
        language: languages[scene.step],
        placement: step.placement,
        animation: {header: timing.header, signatureWidth},
        code: () => (
          <AnimatedCodeView
            html={scene.code}
            languageId={tab.languageId}
            theme={theme}
            showLineNumbers={options.showLineNumbers}
            fontFamily={fontName}
            fontWeight={options.fontWeight}
            enableLigatures={options.enableLigatures}
          />
        ),
      });
      css.push(frameRules(scene, selectors));
      if (scene.frame.kind === 'window') css.push(keepPadding(selectors));
    }
    scenes.push({
      html: page(
        `<div data-animation-scene="${index}">${canvasStart}${body}${canvasEnd}</div>`,
      ),
      durationMs: scene.durationMs,
      kind: scene.kind,
      step: scene.step,
    });
  }

  const clipMs = scenes.reduce((sum, scene) => sum + scene.durationMs, 0);
  const last = scenes.at(-1);
  if (last)
    last.durationMs +=
      Math.floor((clipFrameCount(clipMs, timing.fps) * 1000) / timing.fps) -
      clipMs;

  return {
    scenes,
    steps: steps.map(({frame, layout}) => ({...frame, exactSize: layout.size})),
    css,
    images: loaded.images,
    fontFamily: fontName,
    width: timeline.width,
    height: timeline.height,
  };
}
