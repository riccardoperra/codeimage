import {useI18n} from '@codeimage/locale';
import {getExportCanvasStore} from '@codeimage/store/canvas';
import {getEditorStore} from '@codeimage/store/editor';
import {getFrameState} from '@codeimage/store/editor/frame';
import {getTerminalState} from '@codeimage/store/editor/terminal';
import {toast} from '@codeimage/ui';
import type {NonEmpty} from '@core/animation/model';
import {frameRules, type FrameSelectors} from '@core/animation/timeline';
import type {ParentProps} from 'solid-js';
import {
  createEffect,
  createMemo,
  createResource,
  For,
  getOwner,
  on,
  Show,
  untrack,
} from 'solid-js';
import type {AppLocaleEntries} from '../../i18n';
import AnimatedCodeView from '../CustomEditor/AnimatedCodeView';
import StaticCodeView from '../CustomEditor/StaticCodeView';
import {FITTED_WINDOW_MIN_WIDTH} from '../Frame/FittedWindow';
import {FrameView, useFrameCodeStyle} from '../Frame/PreviewFrame';
import * as styles from './AnimationPreview.css';
import {
  type CodeStyle,
  planPreview,
  type PreviewPlan,
  type PreviewTab,
} from './planPreview';

// Every scene shares one stylesheet, so each scene's frame rules name it.
const sceneSelectors = (scene: number): FrameSelectors => ({
  frame: `[data-animation-stage] [data-animation-scene="${scene}"] [data-animation-frame]`,
  window: `[data-animation-stage] [data-animation-scene="${scene}"] [data-animation-window]`,
});

// Shows the editor frame, or the animation in its place once a preview has
// planned it.
export function AnimationPreview(props: ParentProps) {
  const {animation, editor} = getEditorStore();
  const frame = getFrameState();
  const terminal = getTerminalState();
  const exportCanvas = getExportCanvasStore();
  const style = useFrameCodeStyle();
  const owner = getOwner();
  const [t] = useI18n<AppLocaleEntries>();
  const previewing = () => animation.playback().state !== 'editing';

  // Reads the tabs only while previewing, so typing plans nothing. Equal
  // inputs keep the last plan.
  const request = createMemo<
    | {
        settings: ReturnType<typeof animation.settings>;
        tabs: NonEmpty<PreviewTab>;
        style: CodeStyle;
        key: string;
      }
    | undefined
  >(previous => {
    if (!previewing()) return previous;
    const settings = animation.settings();
    const [first, ...rest] = settings.steps.map((step): PreviewTab => {
      const tab = editor.state.editors.find(({id}) => id === step.editorId)!;
      return {
        id: tab.id,
        code: tab.code,
        languageId: tab.languageId,
        lineNumberStart: tab.lineNumberStart,
        marks: tab.marks,
        tabName: tab.tab.tabName,
      };
    });
    const codeStyle: CodeStyle = {
      theme: style.theme()!,
      fontFamily: style.fontFamily(),
      fontWeight: style.fontWeight(),
      enableLigatures: style.enableLigatures(),
      showLineNumbers: style.showLineNumbers(),
    };
    const key = JSON.stringify({
      settings,
      tabs: [first, ...rest],
      style: {...codeStyle, theme: codeStyle.theme.id},
      tabNames: editor.state.editors.map(tab => tab.tab.tabName),
      frame: frame.store,
      target: frame.exportTarget()?.id,
      terminal: terminal.state,
      showOnlyActiveTab: exportCanvas.get.showOnlyActiveTab,
    });
    return previous?.key === key
      ? previous
      : {settings, tabs: [first, ...rest], style: codeStyle, key};
  });
  const [plan] = createResource(request, ({settings, tabs, style}) =>
    planPreview(owner, settings, tabs, style),
  );
  const ready = () => previewing() && plan.state === 'ready';

  createEffect(
    on(
      () => plan.state === 'errored',
      errored => {
        if (!errored) return;
        console.error(plan.error);
        toast.error(t('animation.previewFailed'));
        animation.actions.edit();
      },
    ),
  );

  // The editor frame keeps its layout under the stage. Its size is measured
  // into the frame store, which sizes the export frame.
  return (
    <div class={styles.layers}>
      <div
        class={styles.layer}
        style={{visibility: ready() ? 'hidden' : undefined}}
      >
        {props.children}
      </div>
      <Show when={plan.state === 'ready' && plan()} keyed>
        {plan => <AnimationStage plan={plan} visible={ready()} />}
      </Show>
    </div>
  );
}

function AnimationStage(props: {plan: PreviewPlan; visible: boolean}) {
  const {animation, editor} = getEditorStore();
  const style = useFrameCodeStyle();
  const [t] = useI18n<AppLocaleEntries>();
  // A new plan or target mounts a new stage, so both are read once.
  const target = untrack(() => getFrameState().exportTarget());
  const {timeline, tabs, languages} = untrack(() => props.plan);
  const scenes: HTMLElement[] = [];
  const css = [
    `[data-animation-stage] [data-animation-scene]{position:relative;overflow:hidden;width:${timeline.width}px;height:${timeline.height}px}`,
    // Tokens that move past the code box would show scrollbars where the
    // system draws them, as in WebKit. The box clips them as Takumi does.
    '[data-animation-stage] .cm-editor .cm-scroller{overflow:hidden}',
    target
      ? `[data-animation-stage] [data-animation-window]{display:block!important;min-width:${FITTED_WINDOW_MIN_WIDTH}px;width:max-content}`
      : '',
    timeline.css,
    ...timeline.scenes.map((scene, index) =>
      frameRules(scene, sceneSelectors(index)),
    ),
  ].join('\n');

  const sceneAt = (ms: number) => {
    let start = 0;
    for (const [index, scene] of timeline.scenes.entries()) {
      if (ms < start + scene.durationMs) {
        return {index, localMs: ms - start};
      }
      start += scene.durationMs;
    }
    const index = timeline.scenes.length - 1;
    return {index, localMs: timeline.scenes[index].durationMs};
  };

  // A scene that is not displayed has no animations, so the list of the
  // shown scene is read again whenever it or the stage appears.
  let shown: {index: number; animations: Animation[]} | null = null;
  createEffect(() => {
    if (!props.visible) {
      shown = null;
      return;
    }
    const {index, localMs} = sceneAt(animation.playhead());
    if (shown?.index !== index) {
      scenes.forEach((scene, other) => {
        scene.style.display = other === index ? '' : 'none';
      });
      shown = {index, animations: scenes[index].getAnimations({subtree: true})};
    }
    for (const playing of shown.animations) {
      playing.pause();
      playing.currentTime = localMs;
    }
  });

  const returnToEditor = (text?: string) => {
    animation.actions.edit();
    const view = editor.activeEditorView();
    if (!view) return;
    view.focus();
    if (text) view.dispatch(view.state.replaceSelection(text));
  };

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    const frameMs = 1000 / animation.settings().fps;
    if (event.key === ' ') animation.actions.toggle();
    else if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      const step = event.key === 'ArrowLeft' ? -frameMs : frameMs;
      animation.actions.seek(animation.playhead() + step);
    } else if (event.key === 'Escape' || event.key === 'Enter') {
      returnToEditor();
    } else if (event.key.length === 1) returnToEditor(event.key);
    else return;
    event.preventDefault();
    event.stopPropagation();
  };

  return (
    <div
      data-animation-stage
      class={styles.stage}
      tabIndex={0}
      role={'group'}
      aria-roledescription={t('animation.previewRole')}
      aria-label={t('animation.previewLabel')}
      style={{
        display: props.visible ? undefined : 'none',
        zoom: target
          ? Math.min(640, target.resolution[0]) / target.resolution[0]
          : undefined,
      }}
      // The app's hotkeys listen on the body, which a key reaches before
      // Solid's delegated handlers run. A native listener stops it first.
      on:keydown={onKeyDown}
    >
      <style>{css}</style>
      <For each={timeline.scenes}>
        {(scene, index) => {
          const tab = tabs[scene.step];
          return (
            <div
              data-animation-scene={index()}
              style={{display: 'none'}}
              ref={element => (scenes[index()] = element)}
            >
              <FrameView
                animated
                activeTabId={tab.id}
                code={
                  scene.kind === 'hold' ? (
                    <StaticCodeView
                      code={tab.code}
                      marks={tab.marks}
                      languageId={tab.languageId}
                      language={languages[scene.step]}
                      theme={style.theme()!}
                      showLineNumbers={style.showLineNumbers()}
                      lineNumberStart={tab.lineNumberStart}
                      fontFamily={style.fontFamily()}
                      fontWeight={style.fontWeight()}
                      enableLigatures={style.enableLigatures()}
                    />
                  ) : (
                    <AnimatedCodeView
                      html={scene.code}
                      languageId={tab.languageId}
                      theme={style.theme()!}
                      fontFamily={style.fontFamily()}
                      fontWeight={style.fontWeight()}
                      enableLigatures={style.enableLigatures()}
                    />
                  )
                }
              />
            </div>
          );
        }}
      </For>
    </div>
  );
}
