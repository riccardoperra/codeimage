import {getExportCanvasStore} from '@codeimage/store/canvas';
import {getEditorStore} from '@codeimage/store/editor';
import {getFrameState} from '@codeimage/store/editor/frame';
import {getTerminalState} from '@codeimage/store/editor/terminal';
import {toast} from '@codeimage/ui';
import type {NonEmpty} from '@core/animation/model';
import {frameRules, type FrameSelectors} from '@core/animation/timeline';
import type {JSX} from 'solid-js';
import {
  createEffect,
  createMemo,
  createResource,
  createSignal,
  For,
  getOwner,
  on,
  Show,
  untrack,
} from 'solid-js';
import * as styles from '../../components/Animation/AnimationPreview.css';
import {
  type CodeStyle,
  type PlanFrame,
  type PlanSettings,
  planPreview,
  type PreviewPlan,
  type PreviewTab,
} from '../../components/Animation/planPreview';
import AnimatedCodeView from '../../components/CustomEditor/AnimatedCodeView';
import StaticCodeView from '../../components/CustomEditor/StaticCodeView';
import {FITTED_WINDOW_MIN_WIDTH} from '../../components/Frame/FittedWindow';
import {
  FrameView,
  useFrameCodeStyle,
} from '../../components/Frame/PreviewFrame';
import * as terminalStyles from '../../components/Terminal/terminal.css';
import type {AnimateStore} from './store';
import {curveOfStep} from './store';

export type HeaderMode = 'active' | 'none' | 'all';

export interface PreviewOptions {
  store: AnimateStore;
  header: HeaderMode;
  /** A fixed title for the `none` header. */
  title?: () => string;
  /** Whether the stage covers the editor frame now. */
  shown: () => boolean;
  /** Leaves the preview, typing `text` into the editor when given. */
  onExit: (text?: string) => void;
  /** Called each time a new plan is ready to play. */
  onPlanned?: () => void;
}

const sceneSelectors = (scene: number): FrameSelectors => ({
  frame: `[data-animation-stage] [data-animation-scene="${scene}"] [data-animation-frame]`,
  window: `[data-animation-stage] [data-animation-scene="${scene}"] [data-animation-window]`,
});

const headerFrame = (mode: HeaderMode): PlanFrame =>
  mode === 'none'
    ? {showTab: false}
    : {showTab: true, showOnlyActiveTab: mode === 'active'};

interface PlanRequest {
  settings: PlanSettings;
  tabs: NonEmpty<PreviewTab>;
  style: CodeStyle;
  key: string;
}

/**
 * A3's AnimationPreview, driven by the prototype's store: per-step
 * transitions, steps that repeat a tab, and a header mode. It plans with A3's
 * planPreview and plays the core's timeline, as the panel will.
 */
export function Preview(props: PreviewOptions & {children: JSX.Element}) {
  const {editor} = getEditorStore();
  const frame = getFrameState();
  const terminal = getTerminalState();
  const exportCanvas = getExportCanvasStore();
  const style = useFrameCodeStyle();
  const owner = getOwner();
  const [failures, setFailures] = createSignal(0);

  const request = createMemo<PlanRequest | undefined>(previous => {
    if (!props.shown() || props.store.dragging()) return previous;
    const steps = props.store.steps();
    if (steps.length < 2) return undefined;
    // The themes load after the page, and an autoplay can come first.
    if (!style.theme()) return previous;
    const tabs = steps.map((step): PreviewTab => {
      const tab = editor.state.editors.find(({id}) => id === step.editorId)!;
      return {
        id: tab.id,
        code: tab.code,
        languageId: tab.languageId,
        lineNumberStart: tab.lineNumberStart,
        marks: tab.marks,
        tabName: tab.tab.tabName,
      };
    }) as unknown as NonEmpty<PreviewTab>;
    const settings: PlanSettings = {
      transitionMs: 900,
      easing: 'smooth',
      fps: 60,
      steps: steps.map(step => ({
        holdMs: step.holdMs,
        transition: {ms: step.transitionMs, easing: curveOfStep(step.easing)},
      })),
    };
    const codeStyle: CodeStyle = {
      theme: style.theme()!,
      fontFamily: style.fontFamily(),
      fontWeight: style.fontWeight(),
      enableLigatures: style.enableLigatures(),
      showLineNumbers: style.showLineNumbers(),
    };
    const key = JSON.stringify({
      failures: failures(),
      header: props.header,
      settings,
      tabs,
      style: {...codeStyle, theme: codeStyle.theme.id},
      tabNames: editor.state.editors.map(tab => tab.tab.tabName),
      frame: frame.store,
      target: frame.exportTarget()?.id,
      terminal: terminal.state,
      showOnlyActiveTab: exportCanvas.get.showOnlyActiveTab,
    });
    return previous?.key === key
      ? previous
      : {settings, tabs, style: codeStyle, key};
  });
  const [plan] = createResource(request, ({settings, tabs, style}) =>
    planPreview(owner, settings, tabs, style, headerFrame(props.header)),
  );
  const planned = () =>
    request() && plan.state === 'ready' ? plan() : undefined;
  const ready = () => props.shown() && planned() !== undefined;

  createEffect(
    on(planned, value => {
      if (value) props.onPlanned?.();
    }),
  );

  createEffect(
    on(
      () => plan.state === 'errored',
      errored => {
        if (!errored) return;
        console.error(plan.error);
        toast.error('The preview failed');
        props.store.actions.edit();
        setFailures(count => count + 1);
      },
    ),
  );

  return (
    <div class={styles.layers}>
      <div
        class={styles.layer}
        style={{visibility: ready() ? 'hidden' : undefined}}
      >
        {props.children}
      </div>
      <Show when={planned()} keyed>
        {plan => <Stage {...props} plan={plan} visible={ready()} />}
      </Show>
    </div>
  );
}

function Stage(props: PreviewOptions & {plan: PreviewPlan; visible: boolean}) {
  const style = useFrameCodeStyle();
  const target = untrack(() => getFrameState().exportTarget());
  const {timeline, tabs, languages} = untrack(() => props.plan);
  const scenes: HTMLElement[] = [];
  const header = untrack(() => headerFrame(props.header));
  const title = () => props.title?.().trim();

  const css = () =>
    [
      `[data-animation-stage] [data-animation-scene]{position:relative;overflow:hidden;width:${timeline.width}px;height:${timeline.height}px}`,
      '[data-animation-stage] .cm-editor .cm-scroller{overflow:hidden}',
      target
        ? `[data-animation-stage] [data-animation-window]{display:block!important;min-width:${FITTED_WINDOW_MIN_WIDTH}px;width:max-content}`
        : '',
      props.header === 'none' && title()
        ? `[data-animation-stage] .${terminalStyles.header}::after{content:${JSON.stringify(title())};position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font:500 13px/1 Inter,system-ui,sans-serif;opacity:.7;pointer-events:none}`
        : '',
      timeline.css,
      ...timeline.scenes.map((scene, index) =>
        frameRules(scene, sceneSelectors(index)),
      ),
    ].join('\n');

  const sceneAt = (ms: number) => {
    let start = 0;
    for (const [index, scene] of timeline.scenes.entries()) {
      if (ms < start + scene.durationMs) return {index, localMs: ms - start};
      start += scene.durationMs;
    }
    const index = timeline.scenes.length - 1;
    return {index, localMs: timeline.scenes[index].durationMs};
  };

  let shown: {index: number; animations: Animation[]} | null = null;
  createEffect(() => {
    if (!props.visible) {
      shown = null;
      return;
    }
    const {index, localMs} = sceneAt(props.store.playhead());
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

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    const {actions, playhead} = props.store;
    if (event.key === ' ') actions.toggle();
    else if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      actions.seek(playhead() + (event.key === 'ArrowLeft' ? -1 : 1) * 16);
    } else if (event.key === 'Escape' || event.key === 'Enter') props.onExit();
    else if (event.key.length === 1) props.onExit(event.key);
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
      aria-roledescription={'animation preview'}
      aria-label={'Animation preview'}
      style={{
        display: props.visible ? undefined : 'none',
        zoom: target
          ? Math.min(640, target.resolution[0]) / target.resolution[0]
          : undefined,
      }}
      on:keydown={onKeyDown}
      onClick={() => props.onExit()}
    >
      <style>{css()}</style>
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
                {...header}
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
                      showLineNumbers={style.showLineNumbers()}
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
