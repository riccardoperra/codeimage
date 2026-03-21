import {Motion} from 'solid-motionone';
import gradientStyles from '~/theme/gradients.module.css';
import {injectEditorScene} from '~/components/Landing/EditorSteps/scene';
import styles from './DynamicBackgroundExpansion.module.css';

export function DynamicBackgroundExpansion() {
  const scene = injectEditorScene();
  const enabledAnimation = () => scene.enableCircleExpansionGradient();
  return (
    <Motion.div
      class={styles.container}
      animate={{
        opacity: enabledAnimation() ? (scene.progress() > 5 ? 1 : 0) : 0,
      }}
    >
      <Motion.div
        class={`${styles.bgFullAnimation} ${styles.backgroundSecondStep} ${gradientStyles.gradientPurpleBg}`}
        data-activate={scene.currentStep >= 1}
      />
      <Motion.div
        class={`${styles.bgFullAnimation} ${styles.backgroundThirdStep} ${gradientStyles.gradientPurpleDarkerBg}`}
        data-activate={scene.currentStep >= 2}
      />
    </Motion.div>
  );
}
