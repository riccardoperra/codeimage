import clsx from 'clsx';
import {JSX, splitProps} from 'solid-js';
import {Text, TextProps} from '../Text/Text';
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
