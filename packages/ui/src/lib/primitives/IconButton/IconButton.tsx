import clsx from 'clsx';
import {omitProps} from 'solid-use';
import {Button, ButtonProps} from '../Button/Button';
import * as styles from './IconButton.css';

export function IconButton(props: ButtonProps) {
  const classes = () =>
    clsx(
      styles.buttonIconVariants({
        size: props.size,
      }),
      props.class,
    );

  return (
    <Button {...omitProps(props, ['class', 'children'])} class={classes()}>
      {props.children}
    </Button>
  );
}
