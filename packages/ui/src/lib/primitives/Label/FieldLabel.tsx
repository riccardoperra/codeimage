import clsx from 'clsx';
import {Component, FlowComponent, mergeProps, Show} from 'solid-js';
import {Dynamic} from 'solid-js/web';
import {omitProps} from 'solid-use';
import {Box} from '../Box';
import {Text, TextComponentProps, TextProps} from '../Text';
import * as styles from './FieldLabel.css';

type FieldLabelProps = TextProps<'label'> & {
  icon?: Component;
};

export const FieldLabel: FlowComponent<FieldLabelProps> = props => {
  return (
    <Text
      {...omitProps(props, ['class', 'children'])}
      as={'label'}
      weight={'semibold'}
      class={clsx(styles.label, props.class)}
    >
      {props.children}
    </Text>
  );
};

export const FieldLabelHint: FlowComponent<FieldLabelProps> = props => {
  const computedProps = mergeProps(
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
        {...omitProps(computedProps, ['class', 'children'])}
        as={'label'}
        class={clsx(styles.labelHint, props.class)}
      >
        {props.children}
      </Text>
    </Box>
  );
};
