import {getEditorStore} from '@codeimage/store/editor';
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
import {prepareWatermarks} from '../../../core/watermark/browser';
import {frameRules} from '../../../core/animation/timeline';
import type {
  AnimationSettings,
  NonEmpty,
  Size,
} from '../../../core/animation/model';
import {
  collectRasterizeResources,
  cloneExportNode,
} from '../../../core/rasterize/takumi';
import {mp4Config, type VideoFps} from '../../../core/video/encode';
import type {AnimationExport} from '../../../core/video/protocol';
import {getOwner, runWithOwner} from 'solid-js';
import {render} from 'solid-js/web';

export function animationSnapshot() {
  const {animation, editor} = getEditorStore();
  const frame = getFrameState();
  const style = useFrameCodeStyle();
  const owner = getOwner();
  return async (fps: VideoFps, output?: Size): Promise<AnimationExport> => {
    const settings: AnimationSettings = structuredClone({
      ...animation.settings(),
      fps,
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
    const pixelRatio = frame.exportPixelRatio(1);
    const measured = await measurePreview(
      owner,
      tabs,
      codeStyle,
      settings.header,
      output,
    );
    const {timeline, languages} = planPreviewTimeline(settings, measured);
    const contentSize = {
      width: timeline.width * pixelRatio,
      height: timeline.height * pixelRatio,
    };
    const config = mp4Config(contentSize, fps);
    const host = document.createElement('div');
    host.style.cssText =
      'position:fixed;left:0;top:0;opacity:0;pointer-events:none;z-index:-9999';
    document.body.append(host);
    const disposers: (() => void)[] = [];
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
        const tab = tabs[scene.step];
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
            }}
          >
            <FrameView
              targetSize={output}
              animated
              header={settings.header}
              activeTabId={tab.id}
              code={
                scene.kind === 'hold' ? (
                  <StaticCodeView
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
                )
              }
            />
          </div>
        );
        const mount = document.createElement('div');
        host.append(mount);
        const dispose = runWithOwner(owner, () => render(view, mount));
        if (dispose) disposers.push(dispose);
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
      await prepareWatermarks(host);
      captureStyle.remove();
      const collecting = collectRasterizeResources(host, font);
      // Capture every scene before the user can edit a frame setting. The
      // shared collector includes the font runs of every hold and transition.
      const scenes = timeline.scenes.map((scene, index) => {
        return {
          html: cloneExportNode(roots[index]).html,
          durationMs: scene.durationMs,
          css: frameCss[index],
        };
      });
      return {
        scenes,
        resources: (await collecting).resources,
        config,
        pixelRatio,
        contentSize,
        css: [
          `html,body{margin:0;padding:0;background:transparent} [data-video-root]{position:relative;overflow:hidden;width:${config.width / pixelRatio}px!important;height:${config.height / pixelRatio}px!important} .cm-editor .cm-scroller{overflow:hidden}`,
          windowCss,
          motionCss,
        ].join('\n'),
      };
    } finally {
      disposers.forEach(dispose => dispose());
      host.remove();
    }
  };
}
