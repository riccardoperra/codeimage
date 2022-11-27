import {Box, Text} from '@codeimage/ui';
import {Motion} from '@motionone/solid';
import {assignInlineVars} from '@vanilla-extract/dynamic';
import {JSXElement, VoidProps} from 'solid-js';
import * as styles from './StepCard.css';

interface StepCard {
  active: boolean;
  title: JSXElement | string;
  description: JSXElement | string;

  opacityOnDisabled: number;

  activeColor: string;
}

export function StepCard(props: VoidProps<StepCard>) {
  const opacity = () => (props.active ? 1 : props.opacityOnDisabled);

  return (
    <Motion.div
      data-active={props.active}
      class={styles.container}
      animate={{
        opacity: opacity(),
      }}
      style={assignInlineVars({
        [styles.activeColorVar]: props.activeColor,
      })}
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
