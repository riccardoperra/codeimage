import type {ProjectEditorPersistedState} from '../state/editor/model';
import type {PersistedFrameState} from '../state/frame/model';
import '../assets/styles/app.scss';
import '../theme/global.css';
import {getExportTarget} from '@codeimage/config';
import {canHostWatermarkFrame, WATERMARK} from '@codeimage/render/watermark';
import {signatureScale} from '../components/Frame/signatureLayout';
import type {CommentTokens} from '@codemirror/commands';
import {EditorState} from '@codemirror/state';
import type {
  AnimationHost,
  AnimationScenes,
  AnimationTiming,
  ComposedFrame,
  FrameHost,
  FrameMarkup,
  FrameSize,
  ImageBytes,
} from './contract';
import {parseAnnotations} from '../core/diff/parseAnnotations';
import {
  FITTED_WINDOW_MIN_WIDTH,
  fittedPlacement,
} from '../components/Frame/FittedWindow';
import type {FittedPlacement} from '../components/Frame/FittedWindow';
import {
  FrameView,
  frameSignatureScale,
  targetViewport,
} from '../components/Frame/FrameView';
import {
  frameMediaRequest,
  resolveFrameMedia,
} from '../components/Frame/frameMedia';
import type {FrameMedia} from '../components/Frame/frameMedia';
import {
  TONE_SAMPLE_SIZE,
  toneSampleMarkup,
} from '../components/Frame/signatureTone';
import {getEditorStore} from '@codeimage/store/editor';
import type {PersistedFrameState as FrameAppearance} from '@codeimage/store/frame/model';
import type {CustomTheme} from '@codeimage/highlight';
import type {Language} from '@codemirror/language';
import {clipFrameCount} from '@core/animation/clock';
import {easingOf} from '@core/animation/easing';
import {measureCode} from '@core/animation/measure';
import type {AnimationHeader} from '@core/animation/model';
import {
  frameRules,
  planTimeline,
  timelineSize,
  type FrameSelectors,
  type StepLayout,
  type TimelineStep,
} from '@core/animation/timeline';
import {getThemeStore} from '@codeimage/store/theme/theme.store';
import {THEME_REGISTRY} from '@codeimage/store/theme/themeRegistry';
import {SUPPORTED_FONTS} from '@core/configuration/font';
import {loadLanguage, tokenizeCode} from '@core/snapshot/tokenize';
import type {JSX} from 'solid-js';
import {renderToStringAsync} from 'solid-js/web';
import {StateProvider} from 'statebuilder';
import AnimatedCodeView from '../components/CustomEditor/AnimatedCodeView';
import {
  AnimationCanvas,
  animationMatte,
} from '../components/Animation/AnimationCanvas';
import {staticThemeCss} from '../components/CustomEditor/staticTheme';
import * as styles from '../components/Frame/Frame.css';

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

export {SUPPORTED_FONTS};
export const SUPPORTED_FONT_IDS = SUPPORTED_FONTS.map(font => font.id);
export const SUPPORTED_THEME_IDS = THEME_REGISTRY.map(theme => theme.id);

// Solid's client typings omit this server-only option.
const SSR_OPTIONS = {timeoutMs: 30_000, noScripts: true};
const EXPORT_EXCLUDE_CSS =
  '[data-export-exclude="true"]{display:none!important}';

// Only store initialization and JSX serialization share singleton app state.
let queue: Promise<unknown> = Promise.resolve();
function serialize<T>(pass: () => Promise<T>): Promise<T> {
  const result = queue.then(pass);
  queue = result.catch(() => undefined);
  return result;
}

const cssVar = (variable: string) =>
  variable.replace(/^var\((--[^,)]+).*$/, '$1');

// The web frame's min-width is max-content, so it grows past its width, and
// past its max-width, rather than wrap a line. Takumi ignores that min-width.
// Without a size this lets the frame take its content width for measuring;
// with one it pins the frame to the size the renderer derived from it.
function frameSizeCss(size?: FrameSize): string {
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
    .map(([variable, value]) => `${cssVar(variable)}:${value}!important`)
    .join(';')}}`;
}

type RenderSnapshot = Omit<ProjectEditorPersistedState, 'frame'> & {
  width?: number;
  frame: Omit<PersistedFrameState, 'exportTarget' | 'aspectRatio'> &
    Partial<Pick<PersistedFrameState, 'exportTarget' | 'aspectRatio'>>;
};

type Tab = RenderSnapshot['editor']['editors'][number];

function findTab(snapshot: RenderSnapshot, editorId: string): Tab {
  const tab = snapshot.editor.editors.find(({id}) => id === editorId);
  if (!tab) throw new Error(`The snapshot has no tab "${editorId}"`);
  return tab;
}

const NO_MARKS = {lines: [], focusedLines: []};

const page = (body: string) => `<html><body>${body}</body></html>`;

// What every pass of a snapshot shares, whichever tab it shows.
interface LoadedFrame {
  theme: CustomTheme;
  fontName: string;
  appearance: FrameAppearance;
  media: FrameMedia;
  images: ImageBytes[];
  painted: boolean;
}

async function loadFrame(
  snapshot: RenderSnapshot,
  host: FrameHost,
): Promise<LoadedFrame> {
  const {frame, editor} = snapshot;
  const {themeId, fontId} = editor.options;
  const themeDefinition = THEME_REGISTRY.find(theme => theme.id === themeId);
  if (!themeDefinition) throw new Error(`Unknown theme "${themeId}"`);
  const font = SUPPORTED_FONTS.find(font => font.id === fontId);
  if (!font) throw new Error(`Unknown font "${fontId}"`);
  const theme = await themeDefinition.load();
  const appearance = {
    ...frame,
    exportTarget: frame.exportTarget ?? null,
    aspectRatio: frame.aspectRatio ?? null,
    background: frame.background ?? theme.properties.previewBackground,
  };
  const {media, images} = await resolveFrameMedia(
    frameMediaRequest(appearance),
    image =>
      host.pixels(
        {
          html: toneSampleMarkup(image.src),
          css: [],
          images: [image],
          fontFamily: font.name,
        },
        TONE_SAMPLE_SIZE,
      ),
    host.offline,
  );
  const background = appearance.background ?? '';
  const hasBackgroundImage =
    !!media.backgroundImage || /gradient\(/i.test(background);
  const colorSample = hasBackgroundImage
    ? null
    : await host.pixels(
        {
          html: `<html><body style="margin:0"><div style="position:absolute;left:0;top:0;width:1px;height:1px;background-color:${background.replaceAll('&', '&amp;').replaceAll('"', '&quot;')}"></div></body></html>`,
          css: [],
          images: [],
          fontFamily: font.name,
        },
        1,
      );
  return {
    theme,
    fontName: font.name,
    appearance,
    media,
    images,
    painted: canHostWatermarkFrame({
      visible: appearance.visible,
      opacity: appearance.opacity,
      backgroundColor: colorSample
        ? `rgba(0, 0, 0, ${colorSample[3] / 255})`
        : 'transparent',
      hasImage: hasBackgroundImage,
    }),
  };
}

interface Pass {
  appearance: FrameAppearance;
  // The active tab.
  editorId: string;
  language: Language | null;
  placement?: FittedPlacement;
  // Replaces the snapshot's tabs, as the code font probe does.
  editor?: RenderSnapshot['editor'];
  // Replaces the active tab's static code, as a transition scene does.
  code?: () => JSX.Element;
  // An animation step, in its holds and its transitions.
  animation?: StepOptions;
}

// A step of an animation sizes its frame from its own code, as the web export
// does, and its signature from the clip's canvas width.
interface StepOptions {
  header?: AnimationHeader;
  signatureWidth?: number;
}

// Serializes one FrameView of the snapshot, the frame every export draws.
function renderBody(
  snapshot: RenderSnapshot,
  {theme, media}: LoadedFrame,
  pass: Pass,
): Promise<string> {
  const {terminal} = snapshot;
  return serialize(() => {
    const SnapshotFrame = () => {
      const store = getEditorStore();
      store.editor.actions.setFromPersistedState(
        pass.editor ?? snapshot.editor,
      );
      store.frame.setFromPersistedState(pass.appearance);
      store.frame.setWidth(snapshot.width ?? 0);
      store.frame.setHeight(0);
      store.terminal.setFromPersistedState({
        ...terminal,
        background: terminal.background || theme.properties.terminal.main,
        textColor: terminal.textColor || theme.properties.terminal.text,
      });
      getThemeStore().getThemeResource(theme.id)[1].mutate(theme);
      return (
        <FrameView
          tab={store.editor.state.editors.find(({id}) => id === pass.editorId)}
          theme={theme}
          language={pass.language}
          media={media}
          windowPlacement={pass.placement}
          showOnlyActiveTab={false}
          header={pass.animation?.header}
          natural={!!pass.animation}
          signatureWidth={pass.animation?.signatureWidth}
          code={pass.code?.()}
        />
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
  });
}

const frameMarkup = (
  {theme, fontName, images}: LoadedFrame,
  body: string,
): FrameMarkup => ({
  html: page(body),
  css: [staticThemeCss(theme), EXPORT_EXCLUDE_CSS],
  fontFamily: fontName,
  images,
});

// The static export of one tab, as the timeline of an animation sees it too.
interface ComposedStep {
  frame: ComposedFrame;
  body: string;
  // The frame size before rounding. In a target frame, also the window's box
  // and scale, from the top left of the frame's padding box, as FittedWindow
  // places it.
  layout: StepLayout;
  placement?: FittedPlacement;
}

async function composeStep(
  snapshot: RenderSnapshot,
  loaded: LoadedFrame,
  host: FrameHost,
  editorId: string,
  language: Language | null,
  animation?: StepOptions,
): Promise<ComposedStep> {
  const {frame} = snapshot;
  const {appearance, painted} = loaded;
  const target = getExportTarget(frame.exportTarget);
  const pass = (appearance: FrameAppearance, placement?: FittedPlacement) =>
    renderBody(snapshot, loaded, {
      appearance,
      editorId,
      language,
      placement,
      animation,
    });
  const watermarkFrame = (width: number) => ({
    painted,
    inset: WATERMARK.frameInset * signatureScale(width),
  });
  if (target) {
    const bare = frameMarkup(
      loaded,
      await pass({...appearance, exportTarget: null, signature: null}),
    );
    const natural = await host.measure({
      ...bare,
      css: [...bare.css, frameSizeCss()],
    });
    const window = {
      width: Math.max(
        FITTED_WINDOW_MIN_WIDTH,
        natural.width - frame.padding * 2,
      ),
      height: Math.max(1, natural.height - frame.padding * 2),
    };
    const viewport = targetViewport(
      target.resolution,
      frame.padding,
      frame.signature,
      frameSignatureScale({width: snapshot.width ?? 0}, target, {
        natural: !!animation,
        signatureWidth: animation?.signatureWidth,
      }),
    );
    const placement = fittedPlacement(viewport, {
      width: Math.round(window.width),
      height: Math.round(window.height),
    });
    const body = await pass(appearance, placement);
    const markup = frameMarkup(loaded, body);
    const size = {width: target.resolution[0], height: target.resolution[1]};
    return {
      frame: {
        ...markup,
        browserCss: markup.css,
        watermarkFrame: watermarkFrame(size.width),
        size,
      },
      body,
      layout: {
        size,
        window: {...placement, ...window},
      },
      placement,
    };
  }
  const body = await pass(appearance);
  const markup = frameMarkup(loaded, body);
  const natural = await host.measure({
    ...markup,
    css: [...markup.css, frameSizeCss()],
  });
  const size = {
    width: animation
      ? natural.width
      : Math.max(snapshot.width ?? 0, natural.width),
    height: natural.height,
  };
  return {
    frame: {
      ...markup,
      css: [...markup.css, frameSizeCss(size)],
      browserCss: markup.css,
      watermarkFrame: watermarkFrame(size.width),
      size: {width: Math.round(size.width), height: Math.round(size.height)},
    },
    body,
    layout: {size, window: null},
  };
}

// Renders the tab `editorId` as the active one. The first tab by default.
export async function composeFrame(
  snapshot: RenderSnapshot,
  host: FrameHost,
  editorId = snapshot.editor.editors[0].id,
): Promise<ComposedFrame> {
  const tab = findTab(snapshot, editorId);
  const [loaded, language] = await Promise.all([
    loadFrame(snapshot, host),
    loadLanguage(tab.languageId, tab.tabName),
  ]);
  const step = await composeStep(snapshot, loaded, host, tab.id, language);
  return step.frame;
}

// The canvas every scene of a clip draws its frame on, around FRAME_SLOT.
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

// Every scene shares one stylesheet, so each scene's frame rules name it.
const sceneSelectors = (scene: number): FrameSelectors => ({
  frame: `[data-animation-scene="${scene}"] [data-snapshot-frame]`,
  window: `[data-animation-scene="${scene}"] [data-fitted-window]`,
});

// The timeline pins a target's window in a frame without padding. FittedWindow
// places it inside the padding, so a moving window keeps the static padding,
// and the window's place comes from the same box as in the holds.
const keepPadding = ({frame}: FrameSelectors) =>
  `${frame}{padding:${styles.frameVars.padding}!important}`;

// Each step holds the static export of its tab, and each transition draws
// the same FrameView with AnimatedCodeView as its code. A hold keeps the
// window the static export places inline, so the timeline only sizes and
// centers its frame. A transition's keyframes override that inline place.
export async function renderAnimationScenes(
  snapshot: RenderSnapshot,
  timing: AnimationTiming,
  host: AnimationHost,
): Promise<AnimationScenes> {
  const tabs = timing.steps.map(step => findTab(snapshot, step.editorId));
  const [loaded, languages] = await Promise.all([
    loadFrame(snapshot, host),
    Promise.all(tabs.map(tab => loadLanguage(tab.languageId, tab.tabName))),
  ]);
  const {theme, fontName, appearance} = loaded;
  const {options} = snapshot.editor;

  // measureCode finds a glyph by its text, so no tab name may draw one, and
  // the bare frame keeps a signature out of the probe.
  const probe = (code: string): RenderSnapshot['editor'] => ({
    ...snapshot.editor,
    editors: snapshot.editor.editors.map(tab => ({
      ...tab,
      tabName: '',
      ...(tab.id === tabs[0].id
        ? {code, languageId: 'plaintext', lineNumberStart: 1, marks: NO_MARKS}
        : {}),
    })),
  });
  const {metrics, widths} = await measureCode(
    async code => {
      const markup = frameMarkup(
        loaded,
        await renderBody(snapshot, loaded, {
          appearance: {...appearance, exportTarget: null, signature: null},
          editorId: tabs[0].id,
          language: null,
          editor: probe(code),
        }),
      );
      return host.layout({...markup, css: [...markup.css, frameSizeCss()]});
    },
    tabs.map(tab => tab.code),
  );

  // A step list may come back to a tab, which then composes once.
  const composeSteps = async (signatureWidth?: number) => {
    const composed = new Map<string, Promise<ComposedStep>>();
    const steps: ComposedStep[] = [];
    for (const [index, tab] of tabs.entries()) {
      if (!composed.has(tab.id)) {
        composed.set(
          tab.id,
          composeStep(snapshot, loaded, host, tab.id, languages[index], {
            header: timing.header,
            signatureWidth,
          }),
        );
      }
      steps.push(await composed.get(tab.id)!);
    }
    return steps;
  };
  // As in the web export, the signature takes the scale of the clip's canvas
  // in every step, so the steps compose again at that width.
  let steps = await composeSteps();
  const signatureWidth = snapshot.frame.signature
    ? timelineSize(steps.map(({layout}) => layout)).width
    : undefined;
  if (signatureWidth !== undefined) steps = await composeSteps(signatureWidth);

  // A step's own transition leads into it, as in the editor.
  const timelineStep = (index: number): TimelineStep => {
    const {holdMs, transition} = timing.steps[index];
    return {
      lines: tokenizeCode(tabs[index].code, languages[index], theme),
      marks: tabs[index].marks ?? NO_MARKS,
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

  // Every scene draws on one canvas, which paints the frame background once.
  // A hidden frame leaves the matte, the solid colour the web export defaults
  // to, so no scene keeps a transparent margin.
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
    // The page clips its overflow, so it must span the whole video.
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
      body = await renderBody(snapshot, loaded, {
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
  // The web export shows its last frame for a whole frame too, where Takumi
  // would cut it at the end of the clip. Whole milliseconds keep the frame
  // count.
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
