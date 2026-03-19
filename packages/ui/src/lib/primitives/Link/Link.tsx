import clsx from 'clsx';
import type {JSX} from 'solid-js';
import {splitProps} from 'solid-js';
import type {TextProps} from '../Text/Text';
import {Text} from '../Text/Text';
import * as styles from './Link.css';

interface LinkProps extends TextProps<'a'> {
  underline?: boolean;
}

export function Link(props: LinkProps): JSX.Element {
  const [local, others] = splitProps(props, [
    'underline',
    'class',
    'children',
    'as',
  ]);

  return (
    <Text
      as={'a'}
      class={clsx(
        local.class,
        styles.link({
          underline: local.underline,
        }),
      )}
      {...others}
    >
      {props.children}
    </Text>
  );
}
