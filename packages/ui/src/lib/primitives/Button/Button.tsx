import {ElementType} from '@solid-aria/types';
import {elements} from '@solid-primitives/refs';
import clsx from 'clsx';
import {ButtonProps as ShButtonProps} from 'solid-headless';
import {children, JSXElement, ParentProps, Show, splitProps} from 'solid-js';
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

  const resolvedIcon = (): JSXElement => {
    if (!local.leftIcon) return null;
    const item = children(() => local.leftIcon);
    const els = elements(item, SVGElement, HTMLElement);
    // Should always be 1
    els().forEach(el => el.classList.add(styles.buttonIcon));
    return els();
  };

  return (
    <styled.button as={local.as ?? 'button'} class={classes()} {...others}>
      <Show when={!!local.leftIcon && !local.loading}>{resolvedIcon()}</Show>
      <Show when={local.loading}>
        <LoadingCircle class={styles.buttonIcon} size={local.size ?? 'sm'} />
      </Show>
      {local.children}
    </styled.button>
  );
}
