import {inView, scroll} from 'motion';
import {onMount} from 'solid-js';
import {
  gradientBlueBg,
  gradientPurpleBg,
  gradientPurpleDarkerBg,
} from '~/theme/gradients.css';
import {EditorScene} from './EditorScene/EditorScene';
import * as styles from './EditorSteps.css';
import {injectEditorScene} from './scene';
import {StepCardArea} from './StepCardScene/StepCardScene';

export default function EditorSteps() {
  const scene = injectEditorScene();
  let ref: HTMLElement;

  const backgrounds = {
    0: gradientBlueBg,
    1: gradientPurpleBg,
    2: gradientPurpleDarkerBg,
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
        <div class={`${styles.backdrop} ${backdropBackground()}`} />
        <StepCardArea animationProgress={scene.progress()} />
        <EditorScene animationProgress={scene.progress()} />
      </div>
    </section>
  );
}
