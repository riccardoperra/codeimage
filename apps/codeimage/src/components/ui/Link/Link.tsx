import {JSX} from 'solid-js';
import * as styles from './Link.css';
import clsx from 'clsx';
import {Text, TextProps} from '../Text/Text';

export function Link(props: TextProps<'a'>): JSX.Element {
  return (
    <Text as={'a'} {...props} class={clsx(props.class, styles.link)}>
      {props.children}
    </Text>
  );
}
