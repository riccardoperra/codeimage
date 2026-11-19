import clsx from 'clsx';
import type {Component, FlowComponent} from 'solid-js';
import {merge, Show} from 'solid-js';
import {Dynamic} from '@solidjs/web';
import {omit} from 'solid-js';
import {Box} from '../Box';
import type {TextComponentProps, TextProps} from '../Text';
import {Text} from '../Text';
import * as styles from './FieldLabel.css';

type FieldLabelProps = TextProps<'label'> & {
  icon?: Component;
};

export const FieldLabel: FlowComponent<FieldLabelProps> = props => {
  return (
    <Text
      {...omit(props, 'class', 'children')}
      as={'label'}
      weight={'semibold'}
      class={clsx(styles.label, props.class)}
    >
      {props.children}
    </Text>
  );
};

export const FieldLabelHint: FlowComponent<FieldLabelProps> = props => {
  const computedProps = merge(
    {
      weight: 'semibold',
    } as TextComponentProps,
    props,
  );

  return (
    <Box class={styles.labelHintWrapper}>
      <Show when={computedProps.icon}>
        <Box as={'span'} marginRight={1} display={'inlineFlex'}>
          <Dynamic component={computedProps.icon} />
        </Box>
      </Show>

      <Text
        {...omit(computedProps, 'class', 'children')}
        as={'label'}
        class={clsx(styles.labelHint, props.class)}
      >
        {props.children}
      </Text>
    </Box>
  );
};
