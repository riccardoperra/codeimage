import {isMobile} from '@solid-primitives/platform';
import {createEffect, createMemo} from 'solid-js';
import {injectEditorScene} from '~/components/Landing/EditorSteps/scene';
import {injectBreakpoints} from '~/core/breakpoints';
import {StepCard} from '../StepCard/StepCard';
import * as styles from './StepCardScene.css';

interface StepCardAreaProps {
  animationProgress: number;
}

export function StepCardArea(props: StepCardAreaProps) {
  const bp = injectBreakpoints();
  const scene = injectEditorScene();
  const opacityOnDisabled = () => (isMobile || bp.isXs() ? 0 : 0.5);

  const progress = createMemo(() => scene.progress());

  const showFirstStep = () => progress() >= 0 && progress() < 33;
  const showSecondStep = () => progress() >= 33 && progress() < 66;
  const showThirdStep = () => progress() >= 66;
  createEffect(() => console.log('show progress', progress()));

  return (
    <div class={styles.container}>
      <div class={styles.flexibleContent}>
        <div class={styles.innerContent}>
          <div class={styles.grid}>
            <StepCard
              active={showFirstStep()}
              title={'Add your code'}
              description={
                <>
                  Once you've got all of your code into CodeImage, you can
                  customize your snippet.
                </>
              }
              activeColor={'rgb(9, 171, 241)'}
            />

            <StepCard
              active={showSecondStep()}
              title={'Beautify it'}
              description={
                <>
                  Customize your snippet by changing syntax theme, colors,
                  window theme and more...
                </>
              }
              activeColor={'#d554f7'}
            />

            <StepCard
              active={showThirdStep()}
              title={'Share to everyone'}
              description={
                <>
                  Once ready, you can share and embed your snippet everywhere.
                </>
              }
              activeColor={'#8000FF'}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
