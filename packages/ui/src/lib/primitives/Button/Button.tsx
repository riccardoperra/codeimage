import {elements} from '@solid-primitives/refs';
import clsx from 'clsx';
import {Button as ShButton} from 'solid-headless';
import {ButtonProps as ShButtonProps} from 'solid-headless/dist/types/components/Button';
import {ValidConstructor} from 'solid-headless/dist/types/utils/dynamic-prop';
import {children, JSXElement, ParentProps, Show} from 'solid-js';
import {omitProps} from 'solid-use';
import {CustomComponentProps} from '../../utils';
import {LoadingCircle} from '../Loader';
import * as styles from './Button.css';

export type ButtonProps<T extends ValidConstructor = 'button'> =
  CustomComponentProps<
    T,
    {
      leftIcon?: JSXElement;
      loading?: boolean;
    } & ShButtonProps<T> &
      styles.ButtonVariants
  >;

export function Button<T extends ValidConstructor = 'button'>(
  props: ParentProps<ButtonProps<T>>,
): JSXElement {
  const classes = () =>
    clsx(
      styles.buttonVariant({
        pill: props.pill,
        block: props.block,
        theme: props.theme,
        variant: props.variant,
        size: props.size || 'sm',
        loading: props.loading,
      }),
      props.class,
    );

  const resolvedIcon = (): JSXElement => {
    if (!props.leftIcon) return null;
    const item = children(() => props.leftIcon);
    const els = elements(item, SVGElement, HTMLElement);
    // Should always be 1
    els().forEach(el => el.classList.add(styles.buttonIcon));
    return els();
  };

  return (
    <ShButton
      {...omitProps(props, ['class', 'leftIcon', 'loading'])}
      class={classes()}
    >
      <Show when={!!props.leftIcon && !props.loading}>{resolvedIcon()}</Show>
      <Show when={props.loading}>
        <LoadingCircle class={styles.buttonIcon} size={props.size ?? 'sm'} />
      </Show>
      {props.children}
    </ShButton>
  );
}
