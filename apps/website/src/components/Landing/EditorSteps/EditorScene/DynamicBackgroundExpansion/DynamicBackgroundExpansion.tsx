import {Motion} from '@motionone/solid';
import {injectEditorScene} from '~/components/Landing/EditorSteps/scene';
import * as styles from './DynamicBackgroundExpansion.css';

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
        class={styles.backgroundSecondStep}
        data-activate={scene.currentStep >= 1}
      />
      <Motion.div
        class={styles.backgroundThirdStep}
        data-activate={scene.currentStep >= 2}
      />
    </Motion.div>
  );
}
