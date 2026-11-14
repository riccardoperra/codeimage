import type {CustomTheme} from '@codeimage/highlight';
import type {EditorState} from '@codeimage/store/editor/model';
import type {Language} from '@codemirror/language';
import {measureCode, type MeasuredNode} from '@core/animation/measure';
import type {AnimationSettings, NonEmpty} from '@core/animation/model';
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
import {fitScale} from '../Frame/FittedWindow';
import * as frameStyles from '../Frame/Frame.css';
import {FrameView} from '../Frame/PreviewFrame';

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
  const host = document.createElement('div');
  host.style.cssText =
    'position:fixed;left:0;top:0;visibility:hidden;pointer-events:none';
  document.body.append(host);
  const dispose = runWithOwner(owner, () => render(view, host))!;
  try {
    await document.fonts.ready;
    return read(host);
  } finally {
    dispose();
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
  if (!viewport || !content) return {size: {width, height}, window: null};
  const natural = {
    width: Math.max(content.offsetWidth, content.scrollWidth),
    height: Math.max(content.offsetHeight, content.scrollHeight),
  };
  const box = {width: viewport.clientWidth, height: viewport.clientHeight};
  const scale = fitScale(box, natural);
  return {
    size: {width, height},
    window: {
      left: viewport.offsetLeft + (box.width - natural.width * scale) / 2,
      top: viewport.offsetTop + (box.height - natural.height * scale) / 2,
      ...natural,
      scale,
    },
  };
}

// The browser side of renderAnimationScenes: measures the code font and each
// step's static frame in the page, then plans the same timeline.
export async function planPreview(
  owner: Owner | null,
  settings: AnimationSettings,
  tabs: NonEmpty<PreviewTab>,
  style: CodeStyle,
): Promise<PreviewPlan> {
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
            activeTabId={tab.id}
            code={codeView(tab, languages[index])}
          />
        ),
        stepLayout,
      ),
    ),
  );

  const step = (index: number): TimelineStep => ({
    lines: tokenizeCode(tabs[index].code, languages[index], style.theme),
    marks: tabs[index].marks,
    lineNumberStart: tabs[index].lineNumberStart,
    layout: layouts[index],
    holdMs: settings.steps[index].holdMs,
  });
  const [, ...rest] = tabs;
  return {
    timeline: planTimeline(
      [step(0), ...rest.map((_, index) => step(index + 1))],
      {
        transitionMs: settings.transitionMs,
        easing: settings.easing,
        lineNumbers: style.showLineNumbers,
        metrics,
        widths,
      },
    ),
    tabs: [...tabs],
    languages,
  };
}
