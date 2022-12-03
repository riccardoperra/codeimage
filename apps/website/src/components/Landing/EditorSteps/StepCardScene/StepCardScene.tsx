import {injectEditorScene} from '~/components/Landing/EditorSteps/scene';
import {StepCard} from '../StepCard/StepCard';
import * as styles from './StepCardScene.css';

interface StepCardAreaProps {
  animationProgress: number;
}

export function StepCardArea(props: StepCardAreaProps) {
  const scene = injectEditorScene();

  return (
    <div class={styles.container}>
      <div class={styles.flexibleContent}>
        <div class={styles.innerContent}>
          <div class={styles.grid}>
            <StepCard
              active={scene.currentStep === 0}
              title={'Add your code'}
              description={
                <>
                  Once you've got all of your code into CodeImage, you can
                  customize your snippet.
                </>
              }
              activeColor={scene.stepsMainColors['0']}
            />

            <StepCard
              active={scene.currentStep === 1}
              title={'Beautify it'}
              description={
                <>
                  Customize your snippet by changing syntax theme, colors,
                  window theme and more...
                </>
              }
              activeColor={scene.stepsMainColors['1']}
            />

            <StepCard
              active={scene.currentStep === 2}
              title={'Share to everyone'}
              description={
                <>
                  Once ready, you can share and embed your snippet everywhere.
                </>
              }
              activeColor={scene.stepsMainColors['2']}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
