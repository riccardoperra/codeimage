import '../assets/styles/app.scss';
import {getExportTarget} from '@codeimage/config';
import type {CommentTokens} from '@codemirror/commands';
import {EditorState} from '@codemirror/state';
import {parseAnnotations} from '../core/diff/parseAnnotations';
import {
  FITTED_WINDOW_MIN_WIDTH,
  fitScale,
} from '../components/Frame/FittedWindow';
import {
  FrameSignature,
  frameBottomPadding,
  framePadding,
} from '../components/Frame/FrameSignature';

import '../theme/global.css';
import {isAssetLinkUrl, isAssetUrl} from '@codeimage/store/assets/assets';
import {getEditorStore} from '@codeimage/store/editor';
import type {ProjectEditorPersistedState} from '@codeimage/store/editor/model';
import {getThemeStore} from '@codeimage/store/theme/theme.store';
import {THEME_REGISTRY} from '@codeimage/store/theme/themeRegistry';
import type {CustomTheme} from '@codeimage/highlight';
import {measureCode, type MeasuredNode} from '@core/animation/measure';
import type {AnimationSettings} from '@core/animation/model';
import {
  frameRules,
  planTimeline,
  targetWindowCss,
  windowDeclarations,
  type FrameSelectors,
  type StepLayout,
  type TimelineStep,
  type WindowPlacement,
} from '@core/animation/timeline';
import {SUPPORTED_FONTS} from '@core/configuration/font';
import {loadLanguage, tokenizeCode} from '@core/snapshot/tokenize';
import type {Language} from '@codemirror/language';
import {assignInlineVars} from '@vanilla-extract/dynamic';
import type {JSX} from 'solid-js';
import {renderToStringAsync} from 'solid-js/web';
import {StateProvider} from 'statebuilder';
import AnimatedCodeView from '../components/CustomEditor/AnimatedCodeView';
import StaticCodeView from '../components/CustomEditor/StaticCodeView';
import {staticThemeCss} from '../components/CustomEditor/staticTheme';
import * as styles from '../components/Frame/Frame.css';
import {DynamicTerminal} from '../components/Terminal/DynamicTerminal/DynamicTerminal';

export async function annotateCode(
  code: string,
  languageId: string,
  tabName: string,
) {
  const language = await loadLanguage(languageId, tabName);
  const state = EditorState.create({
    doc: code,
    extensions: language ? [language] : [],
  });
  return parseAnnotations(
    code,
    state.languageDataAt<CommentTokens>('commentTokens', 0)[0] ?? {},
  );
}

export const SUPPORTED_FONT_IDS = SUPPORTED_FONTS.map(font => font.id);
export const SUPPORTED_THEME_IDS = THEME_REGISTRY.map(theme => theme.id);

export interface FrameSize {
  width: number;
  height: number;
}

export interface FrameMarkup {
  html: string;
  css: string;
  fontFamily: string;
  backgroundImage: string | null;
}

type RenderSnapshot = ProjectEditorPersistedState & {width?: number};

// Solid's client typings, which the app type-checks against, omit this
// server-only option.
const SSR_OPTIONS = {timeoutMs: 30_000, noScripts: true};

const EXPORT_EXCLUDE_CSS =
  '[data-export-exclude="true"]{display:none!important}';

// The editor, frame and theme stores are app-wide singletons, so renders run
// one at a time and each one sees only its own snapshot.
let queue: Promise<unknown> = Promise.resolve();

function enqueue<T>(task: () => Promise<T>): Promise<T> {
  const result = queue.then(task);
  queue = result.catch(() => undefined);
  return result;
}

// Renders the tab `editorId` as the active one. The first tab by default.
export function renderFrame(
  snapshot: RenderSnapshot,
  editorId?: string,
): Promise<FrameMarkup> {
  return enqueue(() => render(snapshot, editorId));
}

const cssVar = (variable: string) =>
  variable.replace(/^var\((--[^,)]+).*$/, '$1');

// The web frame's min-width is max-content, so it grows past its width, and
// past its max-width, rather than wrap a line. Takumi ignores that min-width.
// Without a size this lets the frame take its content width for measuring;
// with one it pins the frame to the size the renderer derived from it.
export function frameSizeCss(size?: FrameSize): string {
  const declarations = size
    ? [
        [styles.frameVars.width, `${size.width}px`],
        [styles.frameVars.minWidth, `${size.width}px`],
        [styles.frameVars.height, `${size.height}px`],
      ]
    : [
        [styles.frameVars.width, 'max-content'],
        [styles.frameVars.maxWidth, 'none'],
      ];
  return `[data-snapshot-frame]{${declarations
    .map(([variable, value]) => `${cssVar(variable)}:${value}`)
    .join(';')}}`;
}

const SNAPSHOT_SELECTORS: FrameSelectors = {
  frame: '[data-snapshot-frame]',
  window: '[data-snapshot-window]',
};

// The web FittedWindow centers the window in a named target's content box and
// scales it down to fit. Takumi cannot run that DOM measurement, so the
// renderer measures the natural frame first and this places the window.
export function targetLayout(
  frame: RenderSnapshot['frame'],
  natural: FrameSize,
): {size: FrameSize; css: string; window: WindowPlacement} | undefined {
  const target = getExportTarget(frame.exportTarget);
  if (!target) return undefined;
  const [width, height] = target.resolution;
  const {padding} = frame;
  const bottom = frameBottomPadding(padding, frame.signature);
  const window = {
    width: Math.max(1, Math.ceil(natural.width) - 2 * padding),
    height: Math.max(1, Math.ceil(natural.height) - padding - bottom),
  };
  const viewport = {
    width: Math.max(1, width - 2 * padding),
    height: Math.max(1, height - padding - bottom),
  };
  const scale = fitScale(viewport, window);
  const left = padding + (viewport.width - window.width * scale) / 2;
  const top = padding + (viewport.height - window.height * scale) / 2;
  const placement = {left, top, ...window, scale};
  return {
    size: {width, height},
    css: targetWindowCss(SNAPSHOT_SELECTORS, windowDeclarations(placement)),
    window: placement,
  };
}

interface LoadedFrame {
  theme: CustomTheme;
  fontName: string;
  background: string;
  backgroundImage: string | null;
}

async function loadFrame(snapshot: RenderSnapshot): Promise<LoadedFrame> {
  const {frame, editor} = snapshot;
  const {themeId, fontId} = editor.options;
  const themeDefinition = THEME_REGISTRY.find(theme => theme.id === themeId);
  if (!themeDefinition) throw new Error(`Unknown theme "${themeId}"`);
  const font = SUPPORTED_FONTS.find(font => font.id === fontId);
  if (!font) throw new Error(`Unknown font "${fontId}"`);
  if (isAssetUrl(frame.background) && !isAssetLinkUrl(frame.background)) {
    throw new Error(
      `Frame background "${frame.background}" is a browser asset; the snapshot does not carry its image`,
    );
  }
  const theme = await themeDefinition.load();
  const background = frame.background ?? theme.properties.previewBackground;
  return {
    theme,
    fontName: font.name,
    background,
    backgroundImage: isAssetLinkUrl(background)
      ? background.slice('link:'.length)
      : null,
  };
}

function renderFrameBody(
  snapshot: RenderSnapshot,
  {theme, background, backgroundImage}: LoadedFrame,
  activeEditorId: string,
  code: () => JSX.Element,
): Promise<string> {
  const {frame, terminal, editor} = snapshot;
  const SnapshotFrame = () => {
    const store = getEditorStore();
    store.editor.actions.setFromPersistedState(editor);
    store.editor.actions.setActiveEditorId(activeEditorId);
    store.frame.setFromPersistedState(frame);
    store.terminal.setFromPersistedState(terminal);
    getThemeStore().getThemeResource(theme.id)[1].mutate(theme);

    return (
      <div class={styles.previewWrapper}>
        <div
          class={styles.container}
          data-snapshot-frame
          style={assignInlineVars({
            overflow: 'hidden',
            [styles.frameVars.radius]: `${frame.radius}px`,
            [styles.frameVars.padding]: framePadding(
              frame.padding,
              frame.signature,
            ),
          })}
        >
          <div
            class={styles.previewOverlay}
            style={assignInlineVars({
              [styles.frameVars.backgroundColor]: isAssetUrl(background)
                ? 'transparent'
                : background,
              [styles.frameVars.opacity]: `${frame.opacity}%`,
              [styles.frameVars.visibility]: frame.visible
                ? 'visible'
                : 'hidden',
            })}
          >
            {backgroundImage && (
              <img
                src={backgroundImage}
                style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  width: '100%',
                  height: '100%',
                  'object-fit': 'cover',
                }}
              />
            )}
          </div>
          <div data-snapshot-window style={{display: 'contents'}}>
            <DynamicTerminal
              type={terminal.type}
              readonlyTab={true}
              showTab={true}
              showOnlyActiveTab={false}
              shadow={terminal.shadow}
              background={terminal.background || theme.properties.terminal.main}
              accentVisible={terminal.accentVisible}
              textColor={terminal.textColor || theme.properties.terminal.text}
              showHeader={terminal.showHeader}
              showGlassReflection={terminal.showGlassReflection}
              showWatermark={terminal.showWatermark}
              opacity={terminal.opacity}
              alternativeTheme={terminal.alternativeTheme}
              borderType={terminal.borderType}
              themeId={theme.id}
            >
              {code()}
            </DynamicTerminal>
          </div>
          <FrameSignature signature={frame.signature ?? null} />
        </div>
      </div>
    );
  };

  return renderToStringAsync(
    () => (
      <StateProvider>
        <SnapshotFrame />
      </StateProvider>
    ),
    SSR_OPTIONS,
  );
}

function frameCss(snapshot: RenderSnapshot, theme: CustomTheme): string {
  return [
    staticThemeCss(theme),
    EXPORT_EXCLUDE_CSS,
    `[data-snapshot-frame]{${cssVar(styles.frameVars.width)}:${
      snapshot.width === undefined ? 'max-content' : `${snapshot.width}px`
    }}`,
    snapshot.frame.exportTarget
      ? `[data-snapshot-window]{display:block!important;min-width:${FITTED_WINDOW_MIN_WIDTH}px;width:max-content}`
      : '',
  ].join('\n');
}

type Editor = RenderSnapshot['editor']['editors'][number];

function findEditor(snapshot: RenderSnapshot, editorId: string): Editor {
  const editor = snapshot.editor.editors.find(({id}) => id === editorId);
  if (!editor) throw new Error(`The snapshot has no tab "${editorId}"`);
  return editor;
}

const NO_MARKS = {lines: [], focusedLines: []};

function staticCode(
  snapshot: RenderSnapshot,
  {theme, fontName}: LoadedFrame,
  editor: Pick<Editor, 'code' | 'languageId' | 'lineNumberStart' | 'marks'>,
  language: Language | null,
) {
  const {options} = snapshot.editor;
  return () => (
    <StaticCodeView
      code={editor.code}
      marks={editor.marks ?? NO_MARKS}
      languageId={editor.languageId}
      language={language}
      theme={theme}
      showLineNumbers={options.showLineNumbers}
      lineNumberStart={editor.lineNumberStart}
      fontFamily={fontName}
      fontWeight={options.fontWeight}
      enableLigatures={options.enableLigatures}
    />
  );
}

async function render(
  snapshot: RenderSnapshot,
  editorId = snapshot.editor.editors[0].id,
): Promise<FrameMarkup> {
  const activeEditor = findEditor(snapshot, editorId);
  const [loaded, language] = await Promise.all([
    loadFrame(snapshot),
    loadLanguage(activeEditor.languageId, activeEditor.tabName),
  ]);
  const body = await renderFrameBody(
    snapshot,
    loaded,
    activeEditor.id,
    staticCode(snapshot, loaded, activeEditor, language),
  );
  return {
    html: `<html><body>${body}</body></html>`,
    css: frameCss(snapshot, loaded.theme),
    fontFamily: loaded.fontName,
    backgroundImage: loaded.backgroundImage,
  };
}

// Lays out a page with the app stylesheet and the renderer's fonts, in CSS
// pixels. The renderer passes it in, so this entry stays free of Takumi.
export type MeasurePage = (html: string, css: string) => Promise<MeasuredNode>;

export interface AnimationScenes {
  scenes: {html: string; durationMs: number}[];
  css: string;
  width: number;
  height: number;
  fontFamily: string;
  backgroundImage: string | null;
}

// `fps` is the frame rate of the export, which a format can lower.
type ExportSettings = Omit<AnimationSettings, 'fps'> & {fps: number};

export function renderAnimationScenes(
  snapshot: RenderSnapshot,
  settings: ExportSettings,
  measure: MeasurePage,
): Promise<AnimationScenes> {
  return enqueue(() => animationScenes(snapshot, settings, measure));
}

const page = (body: string, scene?: number) =>
  scene === undefined
    ? `<html><body>${body}</body></html>`
    : `<html><body><div data-animation-scene="${scene}">${body}</div></body></html>`;

// Every scene shares one stylesheet, so each scene's frame rules name it.
const sceneSelectors = (scene: number): FrameSelectors => ({
  frame: `[data-animation-scene="${scene}"] ${SNAPSHOT_SELECTORS.frame}`,
  window: `[data-animation-scene="${scene}"] ${SNAPSHOT_SELECTORS.window}`,
});

async function animationScenes(
  snapshot: RenderSnapshot,
  settings: ExportSettings,
  measure: MeasurePage,
): Promise<AnimationScenes> {
  const [first, ...rest] = settings.steps;
  const editors = settings.steps.map(step =>
    findEditor(snapshot, step.editorId),
  );
  const [loaded, languages] = await Promise.all([
    loadFrame(snapshot),
    Promise.all(
      editors.map(editor => loadLanguage(editor.languageId, editor.tabName)),
    ),
  ]);
  const {theme, fontName} = loaded;
  const {options} = snapshot.editor;
  const baseCss = frameCss(snapshot, theme);
  const naturalCss = `${baseCss}\n${frameSizeCss()}`;
  // measureCode finds a glyph by its text, so no tab name may draw one.
  const untitled = {
    ...snapshot,
    editor: {
      ...snapshot.editor,
      editors: snapshot.editor.editors.map(editor => ({
        ...editor,
        tabName: '',
      })),
    },
  };
  const {metrics, widths} = await measureCode(
    async code => {
      const editor = {code, languageId: 'plaintext', lineNumberStart: 1};
      const body = await renderFrameBody(
        untitled,
        loaded,
        editors[0].id,
        staticCode(snapshot, loaded, editor, null),
      );
      return measure(page(body), naturalCss);
    },
    editors.map(editor => editor.code),
  );

  const holds: {body: string; layout: StepLayout}[] = [];
  for (const index of editors.keys()) {
    const body = await renderFrameBody(
      snapshot,
      loaded,
      editors[index].id,
      staticCode(snapshot, loaded, editors[index], languages[index]),
    );
    const natural = await measure(page(body), naturalCss);
    const target = targetLayout(snapshot.frame, natural);
    holds.push({
      body,
      layout: {
        size: target?.size ?? {
          width: Math.max(snapshot.width ?? 0, natural.width),
          height: natural.height,
        },
        window: target?.window ?? null,
      },
    });
  }

  const timelineStep = (
    {holdMs}: AnimationSettings['steps'][number],
    index: number,
  ): TimelineStep => ({
    lines: tokenizeCode(editors[index].code, languages[index], theme),
    marks: editors[index].marks ?? NO_MARKS,
    lineNumberStart: editors[index].lineNumberStart,
    layout: holds[index].layout,
    holdMs,
  });
  const timeline = planTimeline(
    [
      timelineStep(first, 0),
      ...rest.map((step, index) => timelineStep(step, index + 1)),
    ],
    {
      transitionMs: settings.transitionMs,
      easing: settings.easing,
      fps: settings.fps,
      lineNumbers: options.showLineNumbers,
      metrics,
      widths,
    },
  );

  const scenes: AnimationScenes['scenes'] = [];
  // The page clips its overflow, so it must span the whole video.
  const css = [
    baseCss,
    `[data-animation-scene]{width:${timeline.width}px;height:${timeline.height}px}`,
    timeline.css,
  ];
  for (const [index, scene] of timeline.scenes.entries()) {
    const editor = editors[scene.step];
    const body =
      scene.kind === 'hold'
        ? holds[scene.step].body
        : await renderFrameBody(snapshot, loaded, editor.id, () => (
            <AnimatedCodeView
              html={scene.code}
              languageId={editor.languageId}
              theme={theme}
              showLineNumbers={options.showLineNumbers}
              fontFamily={fontName}
              fontWeight={options.fontWeight}
              enableLigatures={options.enableLigatures}
            />
          ));
    css.push(frameRules(scene, sceneSelectors(index)));
    scenes.push({html: page(body, index), durationMs: scene.durationMs});
  }

  return {
    scenes,
    css: css.join('\n'),
    width: timeline.width,
    height: timeline.height,
    fontFamily: fontName,
    backgroundImage: loaded.backgroundImage,
  };
}
