import clsx from 'clsx';
import type {JSX} from '@solidjs/web';
import type {ParentProps} from 'solid-js';
import {omit} from 'solid-js';
import {styled} from '../../utils';
import * as styles from './Badge.css';

// eslint-disable-next-line @typescript-eslint/ban-types
export type BadgeProps = styles.BadgeVariants &
  JSX.IntrinsicElements['div'] & {
    theme: string;
  };

export function Badge(props: ParentProps<BadgeProps>) {
  const classes = () =>
    clsx(
      styles.badge({
        size: props.size,
        variant: props.variant,
      }),
      props.theme,
    );

  const otherProps = omit(
    props,
    'theme',
    'variant',
    'size',
    'children',
    'class',
  );

  return (
    <styled.div class={clsx(classes(), props.class)} {...otherProps}>
      {props.children}
    </styled.div>
  );
}
