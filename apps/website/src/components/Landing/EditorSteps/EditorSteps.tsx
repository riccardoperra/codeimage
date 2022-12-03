import {backgroundColorVar} from '@codeimage/ui';
import {assignInlineVars} from '@vanilla-extract/dynamic';
import {inView, scroll} from 'motion';
import {onMount} from 'solid-js';
import {EditorScene} from './EditorScene/EditorScene';
import * as styles from './EditorSteps.css';
import {injectEditorScene} from './scene';
import {StepCardArea} from './StepCardScene/StepCardScene';

export default function EditorSteps() {
  const scene = injectEditorScene();
  let ref: HTMLElement;

  const backgrounds = {
    0: 'linear-gradient(140deg, rgb(9, 171, 241), rgb(5, 105, 148), rgb(4, 84, 118), rgb(6, 119, 167))',
    1: 'linear-gradient(to right top, #7f469d, #8242aa, #833db7, #8338c4, #8233d2, #8a35da, #9336e2, #9b38ea, #af41ee, #c24af2, #d554f7, #e65ffb)',
    2: 'linear-gradient(-45deg, #402662 0%, #8000FF 100%)',
  };

  const backdropBackground = () => backgrounds[scene.currentStep];

  onMount(() => {
    inView(
      ref,
      entry => {
        scene.setInView(entry.isIntersecting);
        return () => scene.setInView(false);
      },
      {amount: 0.15},
    );
    scroll(({y}) => scene.setProgress(Math.floor(y.progress * 100)), {
      target: ref,
    });
  });

  return (
    <section
      ref={el => {
        ref = el;
        scene.setRef(() => el);
      }}
      class={styles.sectionWrapper}
    >
      <div class={styles.stickyContent}>
        <div
          style={assignInlineVars({[backgroundColorVar]: backdropBackground()})}
          class={styles.backdrop}
        />
        <StepCardArea animationProgress={scene.progress()} />
        <EditorScene animationProgress={scene.progress()} />
      </div>
    </section>
  );
}
