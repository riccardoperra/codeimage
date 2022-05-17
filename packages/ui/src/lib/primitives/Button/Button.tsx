import {AriaButtonProps, createButton} from '@solid-aria/button';
import clsx from 'clsx';
import {JSXElement, mergeProps} from 'solid-js';
import {BaseComponentProps, ElementType} from '../../utils';
import * as styles from './Button.css';

type ButtonProps<T extends ElementType = 'button'> = BaseComponentProps<
  T,
  AriaButtonProps<T> & styles.ButtonVariants
>;

export function Button<T extends ElementType = 'button'>(
  props: ButtonProps<T>,
): JSXElement {
  let ref: HTMLButtonElement | undefined;
  const createButtonProps = mergeProps(() => ({elementType: props.as}), props);
  const {buttonProps} = createButton(createButtonProps, () => ref);
  const classes = () =>
    clsx(
      styles.buttonVariant({
        pill: props.pill,
        block: props.block,
        theme: props.theme,
        variant: props.variant,
        size: props.size || 'sm',
      }),
      props.class,
    );

  return (
    <button {...buttonProps()} ref={ref} class={classes()}>
      {props.children}
    </button>
  );
}
