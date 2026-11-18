import type {ValidComponent as ElementType} from '@solidjs/web';
import clsx from 'clsx';
import type {ParentProps} from 'solid-js';
import {omit} from 'solid-js';
import type {ButtonProps} from '../Button/Button';
import {Button} from '../Button/Button';
import * as styles from './IconButton.css';

export function IconButton<T extends ElementType = 'button'>(
  props: ParentProps<ButtonProps<T>>,
) {
  const classes = () =>
    clsx(styles.iconButton({size: props.size}), props.class);

  return (
    <Button {...omit(props, 'class', 'children')} class={classes()}>
      {props.children}
    </Button>
  );
}
