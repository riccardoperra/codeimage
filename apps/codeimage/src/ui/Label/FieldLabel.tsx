import {Text, TextProps} from '@codeimage/ui';
import {Component, mergeProps, Show} from 'solid-js';
import * as styles from './FieldLabel.css';
import {omitProps} from 'solid-use';
import clsx from 'clsx';
import {Box} from '@codeimage/ui';
import {Dynamic} from 'solid-js/web';

type FieldLabelProps = TextProps<'label'> & {
  icon?: Component;
};

export const FieldLabel: Component<FieldLabelProps> = props => {
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

export const FieldLabelHint: Component<FieldLabelProps> = props => {
  const computedProps = mergeProps(
    {
      weight: 'semibold',
    },
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
