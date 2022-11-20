import {StepCard} from '../StepCard/StepCard';
import * as styles from './StepCardScene.css';

interface StepCardAreaProps {
  animationProgress: number;
}

export function StepCardArea(props: StepCardAreaProps) {
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
                  Once you've got all of your code into CodeImage, you can
                  customize your snippet.
                </>
              }
            />

            <StepCard
              active={
                props.animationProgress >= 33 && props.animationProgress < 66
              }
              title={'Beautify it'}
              description={
                <>
                  Customize your snippet by changing syntax theme, colors,
                  window theme and more...
                </>
              }
            />

            <StepCard
              active={props.animationProgress >= 66}
              title={'Share to everyone'}
              description={
                <>
                  Once ready, you can share and embed your snippet everywhere.
                </>
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
}
