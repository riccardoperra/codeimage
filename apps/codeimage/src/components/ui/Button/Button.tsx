import * as styles from './Button.css';
import {Button as ShButton} from 'solid-headless';
import {ButtonProps as ShButtonProps} from 'solid-headless/dist/types/components/Button';
import {ValidConstructor} from 'solid-headless/dist/types/utils/dynamic-prop';
import {JSXElement} from 'solid-js';

type ButtonProps<T extends ValidConstructor = 'button'> = ShButtonProps<T> &
  styles.ButtonVariants;

export function Button<T extends ValidConstructor = 'button'>(
  props: ButtonProps<T>,
): JSXElement {
  return (
    <ShButton
      {...props}
      class={`${styles.buttonVariant({
        pill: props.pill,
        theme: props.theme,
        variant: props.variant,
        size: props.size || 'sm',
      })} ${props.class || ''}`}
    >
      {props.children}
    </ShButton>
  );
}
