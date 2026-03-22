import {inView, scroll} from 'motion';
import {onMount} from 'solid-js';
import gradientStyles from '~/theme/gradients.module.css';
import {EditorScene} from './EditorScene/EditorScene';
import styles from './EditorSteps.module.css';
import {injectEditorScene} from './scene';
import {StepCardArea} from './StepCardScene/StepCardScene';

export default function EditorSteps() {
  const scene = injectEditorScene();
  const backgrounds = {
    0: gradientStyles.gradientBlueBg,
    1: gradientStyles.gradientPurpleBg,
    2: gradientStyles.gradientPurpleDarkerBg,
  };

  const backdropBackground = () =>
    backgrounds[scene.currentStep as keyof typeof backgrounds];

  onMount(() => {
    const ref = scene.ref();
    if (!ref) {
      return;
    }
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
        scene.setRef(() => el);
      }}
      class={styles.sectionWrapper}
    >
      <div class={styles.stickyContent}>
        <div class={`${styles.backdrop} ${backdropBackground()}`} />
        <StepCardArea />
        <EditorScene animationProgress={scene.progress()} />
      </div>
    </section>
  );
}
