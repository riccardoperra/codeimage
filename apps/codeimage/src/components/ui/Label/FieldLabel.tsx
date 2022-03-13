import {Text, TextProps} from '../Text/Text';
import {Component, mergeProps} from 'solid-js';
import * as styles from './FieldLabel.css';
import {omitProps} from 'solid-use';
import clsx from 'clsx';

type FieldLabelProps = TextProps<'label'>;

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
    <Text
      {...omitProps(computedProps, ['class', 'children'])}
      as={'label'}
      class={clsx(styles.labelHint, props.class)}
    >
      {props.children}
    </Text>
  );
};
