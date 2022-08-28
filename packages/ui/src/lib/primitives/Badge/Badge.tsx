import clsx from 'clsx';
import {JSX, ParentProps} from 'solid-js';
import {omitProps} from 'solid-use';
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

  const otherProps = omitProps(props, ['theme', 'variant', 'size', 'children']);

  return (
    <styled.div class={classes()} {...otherProps}>
      {props.children}
    </styled.div>
  );
}
