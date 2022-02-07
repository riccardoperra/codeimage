import * as styles from './Button.css';
import {Component} from 'solid-js';
import {Button as ShButton} from 'solid-headless';
import {ButtonProps as ShButtonProps} from 'solid-headless/dist/types/components/Button';

type ButtonProps = ShButtonProps & styles.ButtonVariants & {};

export const Button: Component<ButtonProps> = props => {
  return (
    <ShButton
      {...props}
      class={`${styles.buttonVariant({
        theme: props.theme,
        variant: props.variant,
      })} ${props.class || ''}`}
    >
      {props.children}
    </ShButton>
  );
};
