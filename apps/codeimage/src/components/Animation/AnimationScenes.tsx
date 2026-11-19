import {getEditorStore} from '@codeimage/store/editor';
import {getFrameState} from '@codeimage/store/editor/frame';

import {frameRules, type FrameSelectors} from '@core/animation/timeline';

import {For, untrack, createEffect} from 'solid-js';

import AnimatedCodeView from '../CustomEditor/AnimatedCodeView';
import StaticCodeView from '../CustomEditor/StaticCodeView';
import {FITTED_WINDOW_MIN_WIDTH} from '../Frame/FittedWindow';
import {createFrameMedia} from '../Frame/frameMedia';
import {FrameView} from '../Frame/FrameView';
import {useFrameCodeStyle} from '../Frame/PreviewFrame';
import * as styles from './AnimationPreview.css';

import {type PreviewPlan} from './planPreview';

const sceneSelectors = (scene: number): FrameSelectors => ({
  frame: `[data-animation-stage] [data-animation-scene="${scene}"] [data-animation-frame]`,
  window: `[data-animation-stage] [data-animation-scene="${scene}"] [data-animation-window]`,
});

export function AnimationScenes(props: {plan: PreviewPlan; visible: boolean}) {
  const {animation} = getEditorStore();
  const style = useFrameCodeStyle();
  const loadedTheme = () => {
    const theme = style.theme();
    if (!theme) throw new Error('Animation scene has no loaded theme');
    return theme;
  };
  const media = createFrameMedia(() => getFrameState().store);

  const target = untrack(() => getFrameState().exportTarget());
  const {timeline, tabs, languages} = untrack(() => props.plan);
  const scenes: HTMLElement[] = [];
  const css = [
    `[data-animation-stage] [data-animation-scene]{position:relative;overflow:hidden;width:${timeline.width}px;height:${timeline.height}px}`,

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

  let shown: {index: number; animations: Animation[]} | null = null;
  createEffect(
    () => (props.visible ? sceneAt(animation.playhead()) : null),
    scene => {
      if (!scene) {
        shown = null;
        return;
      }
      const {index, localMs} = scene;
      if (shown?.index !== index) {
        scenes.forEach((scene, other) => {
          scene.style.display = other === index ? 'block' : 'none';
        });
        shown = {
          index,
          animations: scenes[index].getAnimations({subtree: true}),
        };
      }
      for (const playing of shown.animations) {
        playing.pause();
        playing.currentTime = localMs;
      }
    },
  );

  return (
    <>
      <style>{css}</style>
      <For each={timeline.scenes}>
        {(scene, index) => {
          const tab = tabs[scene.step];
          return (
            <div
              data-animation-scene={index()}
              class={styles.scene}
              ref={element => (scenes[index()] = element)}
            >
              <FrameView
                animated
                media={media()}
                natural
                signatureWidth={timeline.width}
                header={props.plan.header}
                activeTabId={tab.id}
                code={
                  scene.kind === 'hold' ? (
                    <StaticCodeView
                      code={tab.code}
                      marks={tab.marks}
                      languageId={tab.languageId}
                      language={languages[scene.step]}
                      theme={loadedTheme()}
                      showLineNumbers={style.showLineNumbers()}
                      lineNumberStart={tab.lineNumberStart}
                      fontFamily={style.fontFamily()}
                      fontWeight={style.fontWeight()}
                      enableLigatures={style.enableLigatures()}
                    />
                  ) : (
                    <AnimatedCodeView
                      html={scene.code}
                      timeMs={
                        props.visible &&
                        sceneAt(animation.playhead()).index === index()
                          ? animation.playhead()
                          : undefined
                      }
                      languageId={tab.languageId}
                      theme={loadedTheme()}
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
    </>
  );
}
