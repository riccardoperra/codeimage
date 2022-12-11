import {ElementType} from '@solid-aria/types';
import clsx from 'clsx';
import {ButtonProps as ShButtonProps} from 'solid-headless';
import {JSXElement, ParentProps, Show, splitProps} from 'solid-js';
import {CustomComponentProps, styled} from '../../utils';
import {LoadingCircle} from '../Loader';
import * as styles from './Button.css';
import {ButtonSizes} from './Button.css';

export type ButtonProps<T extends ElementType = 'button'> =
  CustomComponentProps<
    T,
    {
      leftIcon?: JSXElement;
      loading?: boolean;
    } & ShButtonProps<T> &
      styles.ButtonVariants
  >;

export function Button<T extends ElementType = 'button'>(
  props: ParentProps<ButtonProps<T>>,
): JSXElement {
  const [local, others] = splitProps(props, [
    'as',
    'class',
    'loading',
    'pill',
    'loading',
    'block',
    'theme',
    'variant',
    'size',
    'children',
    'leftIcon',
  ]);
  const classes = () =>
    clsx(
      styles.buttonVariant({
        pill: local.pill,
        block: local.block,
        theme: local.theme,
        variant: local.variant,
        size: local.size || ('sm' as ButtonSizes),
        loading: local.loading,
      }),
      local.class,
    );

  return (
    <styled.button as={local.as ?? 'button'} class={classes()} {...others}>
      <Show when={!!local.leftIcon && !local.loading}>
        <span class={styles.buttonIcon}>{local.leftIcon}</span>
      </Show>
      <Show when={local.loading}>
        <LoadingCircle class={styles.buttonIcon} size={local.size ?? 'sm'} />
      </Show>
      {local.children}
    </styled.button>
  );
}
