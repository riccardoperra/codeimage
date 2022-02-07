import * as styles from './Button.css';
import {Component, mergeProps} from 'solid-js';
import {Button as ShButton} from 'solid-headless';
import {ButtonProps as ShButtonProps} from 'solid-headless/dist/types/components/Button';

type ButtonVariant = 'solid' | 'outline';
type ButtonThemeVariants = 'primary' | 'secondary';

type ButtonProps = ShButtonProps & {
  variant?: ButtonVariant;
  theme?: ButtonThemeVariants;
};

export const Button: Component<ButtonProps> = props => {
  const computedProps = mergeProps(
    {
      variant: 'solid',
      theme: 'primary',
    },
    props,
  );

  return (
    <ShButton
      {...props}
      class={styles.buttonVariant({
        theme: computedProps.theme,
        type: computedProps.variant,
      })}
    >
      {props.children}
    </ShButton>
  );
};
