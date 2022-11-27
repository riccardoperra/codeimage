import {Motion} from '@motionone/solid';
import {isMobile} from '@solid-primitives/platform';
import {injectEditorScene} from '~/components/Landing/EditorSteps/scene';
import * as styles from './DynamicBackgroundExpansion.css';

export function DynamicBackgroundExpansion() {
  const scene = injectEditorScene();
  const enabledAnimation = !isMobile;
  return (
    <Motion.div
      class={styles.container}
      animate={{
        opacity: enabledAnimation ? (scene.progress() > 5 ? 1 : 0) : 0,
      }}
    >
      <div
        class={styles.backgroundSecondStep}
        data-activate={scene.currentStep >= 1}
      />
      <Motion.div
        animate={{opacity: scene.currentStep < 1 ? 0 : 1}}
        class={styles.backgroundThirdStep}
        data-activate={scene.currentStep >= 2}
      />
    </Motion.div>
  );
}
