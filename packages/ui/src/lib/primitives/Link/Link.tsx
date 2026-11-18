import clsx from 'clsx';
import type {JSX} from '@solidjs/web';
import {omit} from 'solid-js';
import type {TextProps} from '../Text/Text';
import {Text} from '../Text/Text';
import * as styles from './Link.css';

interface LinkProps extends TextProps<'a'> {
  underline?: boolean;
}

export function Link(props: LinkProps): JSX.Element {
  const others = omit(props, 'underline', 'class', 'children', 'as');

  return (
    <Text
      as={'a'}
      class={clsx(
        props.class,
        styles.link({
          underline: props.underline,
        }),
      )}
      {...others}
    >
      {props.children}
    </Text>
  );
}
