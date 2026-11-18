import type {ValidComponent as ElementType} from '@solidjs/web';
import clsx from 'clsx';
import type {Element as JSXElement, ParentProps} from 'solid-js';
import {Show, omit} from 'solid-js';
import type {CustomComponentProps} from '../../utils';
import {styled} from '../../utils';
import {LoadingCircle} from '../Loader';
import * as styles from './Button.css';
import type {ButtonSizes} from './Button.css';

export type ButtonProps<T extends ElementType = 'button'> =
  CustomComponentProps<
    T,
    {
      leftIcon?: JSXElement;
      loading?: boolean;
    } & styles.ButtonVariants
  >;

export function Button<T extends ElementType = 'button'>(
  props: ParentProps<ButtonProps<T>>,
): JSXElement {
  const others = omit(
    props,
    'as',
    'class',
    'loading',
    'pill',
    'block',
    'theme',
    'variant',
    'size',
    'children',
    'leftIcon',
  );
  const classes = () =>
    clsx(
      styles.buttonVariant({
        pill: props.pill,
        block: props.block,
        theme: props.theme,
        variant: props.variant,
        size: props.size || ('sm' as ButtonSizes),
        loading: props.loading,
      }),
      props.class,
    );

  return (
    <styled.button as={props.as ?? 'button'} class={classes()} {...others}>
      <Show when={!!props.leftIcon && !props.loading}>
        <span class={styles.buttonIcon}>{props.leftIcon}</span>
      </Show>
      <Show when={props.loading}>
        <LoadingCircle class={styles.buttonIcon} size={props.size ?? 'sm'} />
      </Show>
      {props.children}
    </styled.button>
  );
}
