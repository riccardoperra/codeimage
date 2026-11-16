import {easingOf} from '@core/animation/easing';
import type {CustomTheme} from '@codeimage/highlight';
import type {EditorState} from '@codeimage/store/editor/model';
import type {Language} from '@codemirror/language';
import {measureCode, type MeasuredNode} from '@core/animation/measure';
import type {
  AnimationHeader,
  AnimationSettings,
  CodeMetrics,
  GlyphWidths,
  NonEmpty,
  Size,
} from '@core/animation/model';
import {
  planTimeline,
  type StepLayout,
  type Timeline,
  type TimelineStep,
} from '@core/animation/timeline';
import {loadLanguage, tokenizeCode} from '@core/snapshot/tokenize';
import type {JSX, Owner} from 'solid-js';
import {runWithOwner} from 'solid-js';
import {render} from 'solid-js/web';
import StaticCodeView from '../CustomEditor/StaticCodeView';
import {targetLayout} from '@core/animation/target-layout';
import * as frameStyles from '../Frame/Frame.css';
import {getFrameState} from '@codeimage/store/editor/frame';
import {createFrameMedia} from '../Frame/frameMedia';
import {FrameView} from '../Frame/FrameView';

export type PreviewTab = Pick<
  EditorState,
  'id' | 'code' | 'languageId' | 'lineNumberStart' | 'marks'
> & {tabName: string | null};

export interface CodeStyle {
  theme: CustomTheme;
  fontFamily: string;
  fontWeight: number;
  enableLigatures: boolean;
  showLineNumbers: boolean;
}

export interface PreviewPlan {
  timeline: Timeline;
  header: AnimationHeader;
  // The tab of each step, as the timeline was planned from it.
  tabs: PreviewTab[];
  languages: (Language | null)[];
}

const NO_MARKS = {lines: [], focusedLines: []};

// Lays `view` out where nothing shows it, reads it, and removes it. The view
// shares the context of `owner`, as the frame's stores need.
async function measureHidden<T>(
  owner: Owner | null,
  view: () => JSX.Element,
  read: (host: HTMLElement) => T,
): Promise<T> {
  await new Promise<void>(resolve => setTimeout(resolve, 0));
  const host = document.createElement('div');
  host.style.cssText =
    'position:fixed;left:0;top:0;visibility:hidden;pointer-events:none';
  document.body.append(host);
  let dispose: (() => void) | undefined;
  try {
    dispose = runWithOwner(owner, () => render(view, host));
    await document.fonts.ready;
    await new Promise<void>(resolve => setTimeout(resolve, 0));
    return read(host);
  } finally {
    dispose?.();
    host.remove();
  }
}

// The tree measureCode reads: one run per line, measured with a DOM range.
function codeTree(host: HTMLElement): MeasuredNode {
  const range = document.createRange();
  const box = host.getBoundingClientRect();
  return {
    width: box.width,
    height: box.height,
    children: [],
    runs: [...host.querySelectorAll('.cm-line')].map(line => {
      range.selectNodeContents(line);
      return {
        text: line.textContent ?? '',
        width: range.getBoundingClientRect().width,
      };
    }),
  };
}

// The static frame of a step, as the web export draws it. A target frame
// places its window as FittedWindow does, from its top left corner.
function stepLayout(host: HTMLElement): StepLayout {
  const frame = host.querySelector<HTMLElement>(`.${frameStyles.container}`)!;
  const {width, height} = frame.getBoundingClientRect();
  const viewport = frame.querySelector<HTMLElement>('[data-fit-window]');
  const content = frame.querySelector<HTMLElement>('[data-fitted-window]');
  if (!viewport || !content)
    return {
      size: {
        width: Math.max(width, frame.scrollWidth),
        height: Math.max(height, frame.scrollHeight),
      },
      window: null,
    };
  const natural = {
    width: Math.max(content.offsetWidth, content.scrollWidth),
    height: Math.max(content.offsetHeight, content.scrollHeight),
  };
  const box = {width: viewport.clientWidth, height: viewport.clientHeight};
  return {
    size: {width, height},
    window: targetLayout(box, natural, {
      x: viewport.offsetLeft,
      y: viewport.offsetTop,
    }),
  };
}

// The browser side of renderAnimationScenes: measures the code font and each
// step's static frame in the page, then plans the same timeline.
export async function measurePreview(
  owner: Owner | null,
  tabs: NonEmpty<PreviewTab>,
  style: CodeStyle,
  header: AnimationHeader,
  targetSize?: Size,
  natural = true,
): Promise<PreviewMeasurement> {
  const languages = await Promise.all(
    tabs.map(tab => loadLanguage(tab.languageId, tab.tabName)),
  );
  const codeView = (
    tab: Omit<PreviewTab, 'id' | 'tabName'>,
    language: Language | null,
  ) => (
    <StaticCodeView
      code={tab.code}
      marks={tab.marks}
      languageId={tab.languageId}
      language={language}
      theme={style.theme}
      showLineNumbers={style.showLineNumbers}
      lineNumberStart={tab.lineNumberStart}
      fontFamily={style.fontFamily}
      fontWeight={style.fontWeight}
      enableLigatures={style.enableLigatures}
    />
  );

  const {metrics, widths} = await measureCode(
    code =>
      measureHidden(
        owner,
        () =>
          codeView(
            {
              code,
              languageId: 'plaintext',
              lineNumberStart: 1,
              marks: NO_MARKS,
            },
            null,
          ),
        codeTree,
      ),
    tabs.map(tab => tab.code),
  );
  const layouts = await Promise.all(
    tabs.map((tab, index) =>
      measureHidden(
        owner,
        () => (
          <FrameView
            media={createFrameMedia(() => getFrameState().store)()}
            targetSize={targetSize}
            natural={natural}
            header={header}
            activeTabId={tab.id}
            code={codeView(tab, languages[index])}
          />
        ),
        stepLayout,
      ),
    ),
  );

  const step = (index: number) => ({
    lines: tokenizeCode(tabs[index].code, languages[index], style.theme),
    marks: tabs[index].marks,
    lineNumberStart: tabs[index].lineNumberStart,
    layout: layouts[index],
  });
  const [, ...rest] = tabs;
  return {
    steps: [step(0), ...rest.map((_, index) => step(index + 1))],
    tabs: [...tabs],
    languages,
    metrics,
    widths,
    lineNumbers: style.showLineNumbers,
  };
}

export interface PreviewMeasurement {
  steps: NonEmpty<Omit<TimelineStep, 'holdMs'>>;
  tabs: PreviewTab[];
  languages: (Language | null)[];
  metrics: CodeMetrics;
  widths: GlyphWidths;
  lineNumbers: boolean;
}

export function planPreviewTimeline(
  settings: Omit<AnimationSettings, 'fps'> & {fps: number},
  measured: PreviewMeasurement,
): PreviewPlan {
  const step = (
    value: PreviewMeasurement['steps'][number],
    index: number,
  ): TimelineStep => {
    const timing = settings.steps[index];
    return {
      ...value,
      holdMs: timing.holdMs,
      transition: timing.transition && {
        ms: timing.transition.ms,
        easing: easingOf(timing.transition.easing),
      },
    };
  };
  const [first, ...rest] = measured.steps;
  return {
    timeline: planTimeline(
      [step(first, 0), ...rest.map((value, index) => step(value, index + 1))],
      {
        transitionMs: settings.transitionMs,
        easing: easingOf(settings.easing),
        fps: settings.fps,
        lineNumbers: measured.lineNumbers,
        metrics: measured.metrics,
        widths: measured.widths,
      },
    ),
    tabs: measured.tabs,
    languages: measured.languages,
    header: settings.header,
  };
}
