import {getEditorStore} from '@codeimage/store/editor';
import {getAssetsStore} from '@codeimage/store/assets/assets';
import {AssetsImage} from '@codeimage/store/assets/AssetsImage';
import {getFrameState} from '@codeimage/store/editor/frame';
import {
  useFrameCodeStyle,
  FrameView,
} from '../../../components/Frame/PreviewFrame';
import {FITTED_WINDOW_MIN_WIDTH} from '../../../components/Frame/FittedWindow';
import StaticCodeView from '../../../components/CustomEditor/StaticCodeView';
import AnimatedCodeView from '../../../components/CustomEditor/AnimatedCodeView';
import {
  measurePreview,
  planPreviewTimeline,
  type CodeStyle,
  type PreviewTab,
} from '../../../components/Animation/planPreview';
import {prepareWatermark} from '../../../core/watermark/scope';
import {frameRules} from '../../../core/animation/timeline';
import type {NonEmpty, Size} from '../../../core/animation/model';
import {
  collectSnapshotResources,
  cloneAnimationNode,
} from '../../../core/rasterize/takumi';
import {
  ANIMATION_FORMATS,
  animationConfig,
  gifFrameBudget,
  type AnimationFps,
  type AnimationFormat,
} from '../../../core/video/formats';
import type {AnimationExport} from '../../../core/video/protocol';
import {createSignal, getOwner, runWithOwner, Show} from 'solid-js';
import {render} from 'solid-js/web';

const yieldToEditor = () =>
  new Promise<void>(resolve => setTimeout(resolve, 0));

export function animationSnapshot() {
  const {animation, editor} = getEditorStore();
  const frame = getFrameState();
  const style = useFrameCodeStyle();
  const owner = getOwner();
  const measure = async (
    fps: AnimationFps,
    output: Size | undefined,
    scale: number,
    format: AnimationFormat,
  ) => {
    const settings = structuredClone({
      ...animation.settings(),
      fps: ANIMATION_FORMATS[format].frameRate(fps),
    });
    const tab = (editorId: string): PreviewTab => {
      const value = editor.state.editors.find(tab => tab.id === editorId);
      if (!value) throw new Error('Animation step no longer exists');
      return {
        id: value.id,
        code: value.code,
        languageId: value.languageId,
        lineNumberStart: value.lineNumberStart,
        marks: structuredClone({
          ...value.marks,
          lines: value.marks.lines.map(mark => ({...mark})),
          focusedLines: [...value.marks.focusedLines],
        }),
        tabName: value.tab.tabName,
      };
    };
    const [first, ...rest] = settings.steps;
    const tabs: NonEmpty<PreviewTab> = [
      tab(first.editorId),
      ...rest.map(step => tab(step.editorId)),
    ];
    const codeStyle: CodeStyle = {
      theme: style.theme()!,
      fontFamily: style.fontFamily(),
      fontWeight: style.fontWeight(),
      enableLigatures: style.enableLigatures(),
      showLineNumbers: style.showLineNumbers(),
    };
    const font = editor.computed.selectedFont();
    const target = output ?? frame.exportTarget();
    const pixelRatio = output ? 1 : frame.exportPixelRatio(scale);
    const measured = await measurePreview(
      owner,
      tabs,
      codeStyle,
      settings.header,
      output,
      false,
    );
    const {timeline, languages} = planPreviewTimeline(settings, measured);
    // Natural padding is already covered by the gradient area term. Only
    // fixed targets need an additional charge for their exposed background.
    const backgroundArea = target
      ? (measured.steps.reduce((sum, {layout}) => {
          const window = layout.window;
          const windowArea = window
            ? window.width * window.height * window.scale ** 2
            : Math.max(0, layout.size.width - frame.store.padding * 2) *
              Math.max(0, layout.size.height - frame.store.padding * 2);
          return (
            sum +
            Math.max(0, layout.size.width * layout.size.height - windowArea)
          );
        }, 0) /
          measured.steps.length) *
        pixelRatio ** 2
      : 0;
    const contentSize = {
      width: timeline.width * pixelRatio,
      height: timeline.height * pixelRatio,
    };
    const config = animationConfig(format, contentSize, fps);
    return {
      settings,
      tabs,
      codeStyle,
      font,
      target,
      pixelRatio,
      timeline,
      languages,
      contentSize,
      config,
      metrics: measured.metrics,
      backgroundArea,
    };
  };
  const describe = async (
    fps: AnimationFps,
    output: Size | undefined,
    scale: number,
    format: AnimationFormat,
  ) => {
    const {config, timeline, tabs, metrics, pixelRatio, backgroundArea} =
      await measure(fps, output, scale, format);
    const ms = timeline.scenes.reduce(
      (sum, scene) => sum + scene.durationMs,
      0,
    );
    const durationMs =
      (Math.ceil((ms * config.fps) / 1000) * 1000) / config.fps;
    const frameBudget = gifFrameBudget(timeline.scenes, config.fps);
    const estimatedBytes = ANIMATION_FORMATS[format].estimate({
      ...config,
      durationMs,
      frameBudget,
      pixelRatio,
      textArea:
        (tabs.reduce(
          (sum, tab) => sum + tab.code.replace(/\s/g, '').length,
          0,
        ) /
          tabs.length) *
        metrics.charWidth *
        metrics.lineHeight,
      detailedBackground:
        frame.store.visible &&
        frame.store.opacity > 0 &&
        (getAssetsStore().isAssetUrl(frame.store.background) ||
          /(?:gradient|url)\(/i.test(frame.store.background ?? '')),
      backgroundArea,
    });
    return {config, durationMs, estimatedBytes, frameBudget};
  };
  const capture = async (
    fps: AnimationFps,
    output: Size | undefined,
    scale: number,
    matte: string,
    format: AnimationFormat,
  ): Promise<AnimationExport> => {
    const {
      settings,
      tabs,
      codeStyle,
      font,
      target,
      pixelRatio,
      timeline,
      languages,
      contentSize,
      config,
    } = await measure(fps, output, scale, format);
    const assets = getAssetsStore();
    const background = frame.store.background;
    const backgroundImage = assets.isAssetUrl(background)
      ? background
      : undefined;
    const visibleBackground = frame.store.visible && frame.store.opacity > 0;
    const host = document.createElement('div');
    host.style.cssText =
      'position:fixed;left:0;top:0;opacity:0;pointer-events:none;z-index:-9999';
    document.body.append(host);
    const disposers: (() => void)[] = [];
    const frames: HTMLElement[] = [];
    const scope = `video-${crypto.randomUUID()}`;
    const scopedCss = (value: string) =>
      value.replace(/\bt(\d+)-/g, `${scope}-t$1-`);
    const motionCss = scopedCss(timeline.css);
    const windowCss = target
      ? `[data-video-capture="${scope}"] [data-animation-window]{display:block!important;min-width:${FITTED_WINDOW_MIN_WIDTH}px;width:max-content}`
      : '';
    const frameCss = timeline.scenes.map((scene, index) =>
      scopedCss(
        frameRules(scene, {
          frame: `[data-video-capture="${scope}"][data-video-scene="${index}"] [data-animation-frame]`,
          window: `[data-video-capture="${scope}"][data-video-scene="${index}"] [data-animation-window]`,
        }),
      ),
    );
    const captureStyle = document.createElement('style');
    captureStyle.textContent = [motionCss, windowCss, ...frameCss].join('\n');
    host.append(captureStyle);
    try {
      for (const [index, scene] of timeline.scenes.entries()) {
        await yieldToEditor();
        const tab = tabs[scene.step];
        const [codeReady, setCodeReady] = createSignal(false);
        const [lineLimit, setLineLimit] = createSignal(0);
        const view = () => (
          <div
            data-video-root
            data-video-capture={scope}
            data-video-scene={index}
            style={{
              position: 'relative',
              overflow: 'hidden',
              width: `${config.width / pixelRatio}px`,
              height: `${config.height / pixelRatio}px`,
              'background-color': matte,
            }}
          >
            <Show when={visibleBackground}>
              <div
                data-video-background
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: backgroundImage
                    ? undefined
                    : (background ?? undefined),
                }}
              >
                <Show when={backgroundImage}>
                  <AssetsImage
                    assetId={backgroundImage!}
                    style={{
                      position: 'absolute',
                      inset: 0,
                      width: '100%',
                      height: '100%',
                      'object-fit': 'cover',
                    }}
                  />
                </Show>
              </div>
            </Show>
            <FrameView
              ref={element => frames.push(element)}
              targetSize={output}
              animated
              header={settings.header}
              activeTabId={tab.id}
              code={
                codeReady() &&
                (scene.kind === 'hold' ? (
                  <StaticCodeView
                    lineLimit={lineLimit()}
                    code={tab.code}
                    marks={tab.marks}
                    languageId={tab.languageId}
                    language={languages[scene.step]}
                    theme={codeStyle.theme}
                    showLineNumbers={codeStyle.showLineNumbers}
                    lineNumberStart={tab.lineNumberStart}
                    fontFamily={codeStyle.fontFamily}
                    fontWeight={codeStyle.fontWeight}
                    enableLigatures={codeStyle.enableLigatures}
                  />
                ) : (
                  <AnimatedCodeView
                    html={scene.code}
                    languageId={tab.languageId}
                    theme={codeStyle.theme}
                    showLineNumbers={codeStyle.showLineNumbers}
                    fontFamily={codeStyle.fontFamily}
                    fontWeight={codeStyle.fontWeight}
                    enableLigatures={codeStyle.enableLigatures}
                  />
                ))
              }
            />
          </div>
        );
        const mount = document.createElement('div');
        host.append(mount);
        const dispose = runWithOwner(owner, () => render(view, mount));
        if (dispose) disposers.push(dispose);
        await yieldToEditor();
        setCodeReady(true);
        if (scene.kind === 'hold') {
          const lines = tab.code.split('\n').length;
          for (let limit = 4; limit < lines + 4; limit += 4) {
            await yieldToEditor();
            setLineLimit(limit);
          }
        }
      }
      for (const element of host.querySelectorAll<HTMLElement>('[style]')) {
        if (element.style.animationName)
          element.style.animationName = scopedCss(element.style.animationName);
      }
      await document.fonts.ready;
      // Mount transitions (such as the watermark) need two paint turns to
      // switch from their enter-from classes to their static appearance.
      await new Promise<void>(resolve =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      );
      const roots = [
        ...host.querySelectorAll<HTMLElement>('[data-video-root]'),
      ];
      for (const root of roots) {
        for (const playing of root.getAnimations({subtree: true})) {
          if (
            'animationName' in playing &&
            typeof playing.animationName === 'string' &&
            playing.animationName.startsWith(scope)
          ) {
            playing.pause();
            playing.currentTime = 0;
          }
        }
      }
      for (const frame of frames) {
        await yieldToEditor();
        await prepareWatermark(frame);
      }
      const scenes: AnimationExport['scenes'] = [];
      const fontFamilies = new Set<string>();
      let text = '';
      for (const [index, scene] of timeline.scenes.entries()) {
        await yieldToEditor();
        const snapshot = await cloneAnimationNode(roots[index]);
        snapshot.fontFamilies.forEach(family => fontFamilies.add(family));
        text += snapshot.text;
        scenes.push({
          html: snapshot.html,
          durationMs: scene.durationMs,
          css: frameCss[index],
        });
      }
      // Watermark observers need these layout rules until every scene is captured.
      captureStyle.remove();
      const resources = await collectSnapshotResources(
        {text, fontFamilies},
        font,
      );
      return {
        scenes,
        resources,
        config,
        pixelRatio,
        contentSize,
        css: [
          `html,body{margin:0;padding:0;background:transparent} [data-video-root]{position:relative;overflow:hidden;width:${config.width / pixelRatio}px!important;height:${config.height / pixelRatio}px!important} .cm-editor .cm-scroller{overflow:hidden}`,
          // A fixed scene box must not reflow a code run at a token boundary.
          // Takumi needs the intrinsic minimum on both lines and runs.
          '.cm-content .cm-line,.cm-content .cm-line span{white-space:pre!important;min-width:max-content;word-break:normal;overflow-wrap:normal}',
          windowCss,
          motionCss,
        ].join('\n'),
      };
    } finally {
      for (const dispose of disposers) {
        await yieldToEditor();
        dispose();
      }
      host.remove();
    }
  };
  return {describe, capture};
}
