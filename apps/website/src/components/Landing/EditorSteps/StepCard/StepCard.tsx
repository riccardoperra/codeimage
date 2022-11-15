import {Motion} from '@motionone/solid';
import {Box, Text} from '@codeimage/ui';
import {JSXElement, VoidProps} from 'solid-js';
import * as styles from './StepCard.css';

interface StepCard {
  active: boolean;
  title: JSXElement | string;
  description: JSXElement | string;
}

export function StepCard(props: VoidProps<StepCard>) {
  const opacity = () => (props.active ? 1 : '0.25');

  return (
    <Motion.div
      class={styles.container}
      animate={{
        // opacity: props.progress >= 0 && props.progress < 33 ? 1 : 0.25,
        opacity: opacity(),
      }}
    >
      <div>
        <Text weight={'bold'} size={'2xl'}>
          {props.title}
        </Text>

        <Box marginTop={6}>
          <Text size={'lg'} style={{'line-height': 1.5}}>
            {props.description}
          </Text>
        </Box>
      </div>
    </Motion.div>
  );
}
