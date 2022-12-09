import {ElementType} from '@solid-aria/types';
import clsx from 'clsx';
import {ParentProps} from 'solid-js';
import {omitProps} from 'solid-use';
import {Button, ButtonProps} from '../Button/Button';
import * as styles from './IconButton.css';

export function IconButton<T extends ElementType = 'button'>(
  props: ParentProps<ButtonProps<T>>,
) {
  const classes = () =>
    clsx(styles.iconButton({size: props.size}), props.class);

  return (
    <Button {...omitProps(props, ['class', 'children'])} class={classes()}>
      {props.children}
    </Button>
  );
}
