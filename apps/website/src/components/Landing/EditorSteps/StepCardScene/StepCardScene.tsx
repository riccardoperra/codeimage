import {StepCard} from '../StepCard/StepCard';
import * as styles from './StepCardScene.css';

interface StepCardAreaProps {
  animationProgress: number;
}

export function StepCardScene(props: StepCardAreaProps) {
  return (
    <div class={styles.container}>
      <div class={styles.flexibleContent}>
        <div class={styles.innerContent}>
          <div class={styles.grid}>
            <StepCard
              active={
                props.animationProgress >= 0 && props.animationProgress < 33
              }
              title={'Add your code'}
              description={
                <>
                  Insert your code in the editor that helps you to create
                  beautiful snippets of your source code in{' '}
                  <strong>seconds</strong>
                </>
              }
            />

            <StepCard
              active={
                props.animationProgress >= 33 && props.animationProgress < 66
              }
              title={'Beautify it'}
              description={
                <>CodeImage provide a rich choice of known and custom themes.</>
              }
            />

            <StepCard
              active={props.animationProgress >= 66}
              title={'Share to everyone'}
              description={
                <>Once ready, you can share your snippet everywhere.</>
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
}
