import clsx from 'clsx';
import {Component, ParentComponent, Show} from 'solid-js';
import {Dynamic} from 'solid-js/web';
import {omitProps} from 'solid-use';
import {mergeProps2} from '../../utils/types';
import {Box} from '../Box';
import {Text, TextProps} from '../Text';
import * as styles from './FieldLabel.css';

type FieldLabelProps = TextProps<'label'> & {
  icon?: Component;
};

export const FieldLabel: ParentComponent<FieldLabelProps> = props => {
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
  const computedProps = mergeProps2(
    {
      weight: 'semibold',
    } as FieldLabelProps,
    props,
  );

  return (
    <Box class={styles.labelHintWrapper}>
      <Show when={computedProps.icon}>
        <Box as={'span'} marginRight={'1'} display={'inlineFlex'}>
          <Dynamic component={computedProps.icon} />
        </Box>
      </Show>

      <Text
        as={'label'}
        class={clsx(styles.labelHint, props.class)}
        {...omitProps(computedProps, ['class', 'children'])}
      >
        {props.children}
      </Text>
    </Box>
  );
};
