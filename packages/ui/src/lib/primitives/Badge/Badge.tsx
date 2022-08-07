import clsx from 'clsx';
import {ParentProps} from 'solid-js';
import {styled} from '../../utils';
import * as styles from './Badge.css';

// eslint-disable-next-line @typescript-eslint/ban-types
export type BadgeProps = styles.BadgeVariants & {
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

  return <styled.div class={classes()}>{props.children}</styled.div>;
}
