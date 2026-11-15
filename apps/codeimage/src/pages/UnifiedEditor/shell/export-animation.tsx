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
      'position:fixed;left:0;top:0;visibility:hidden;pointer-events:none';
    document.body.append(host);
    const disposers: (() => void)[] = [];
    try {
      for (const scene of timeline.scenes) {
        const tab = tabs[scene.step];
        const view = () => (
          <div
            data-video-root
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
      await document.fonts.ready;
      // Mount transitions (such as the watermark) need two paint turns to
      // switch from their enter-from classes to their static appearance.
      await new Promise<void>(resolve =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      );
      const roots = [
        ...host.querySelectorAll<HTMLElement>('[data-video-root]'),
      ];
      const collecting = collectRasterizeResources(host, font);
      // Capture every scene before the user can edit a frame setting. The
      // shared collector includes the font runs of every hold and transition.
      const scenes = timeline.scenes.map((scene, index) => {
        return {
          html: cloneExportNode(roots[index]).html,
          durationMs: scene.durationMs,
          css: frameRules(scene, {
            frame: '[data-video-root] [data-animation-frame]',
            window: '[data-video-root] [data-animation-window]',
          }),
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
          target
            ? `[data-video-root] [data-animation-window]{display:block!important;min-width:${FITTED_WINDOW_MIN_WIDTH}px;width:max-content}`
            : '',
          timeline.css,
        ].join('\n'),
      };
    } finally {
      disposers.forEach(dispose => dispose());
      host.remove();
    }
  };
}
