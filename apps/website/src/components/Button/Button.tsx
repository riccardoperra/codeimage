import {type JSX, type ParentProps, Show} from 'solid-js';
import {splitProps} from 'solid-js';
import {Dynamic} from 'solid-js/web';
import styles from './Button.module.css';

type ButtonTheme = 'primary' | 'primaryAlt' | 'secondary';
type ButtonSize = 'md' | 'lg' | 'xl';
type ButtonAs = 'button' | 'a';

type ButtonProps = ParentProps<{
  as?: ButtonAs;
  theme?: ButtonTheme;
  size?: ButtonSize;
  leftIcon?: JSX.Element;
  class?: string;
}> &
  Omit<JSX.ButtonHTMLAttributes<HTMLButtonElement>, 'class'> &
  Omit<JSX.AnchorHTMLAttributes<HTMLAnchorElement>, 'class'>;

const themeClassMap: Record<ButtonTheme, string> = {
  primary: styles.themePrimary,
  primaryAlt: styles.themePrimaryAlt,
  secondary: styles.themeSecondary,
};

const sizeClassMap: Record<ButtonSize, string> = {
  md: styles.sizeMd,
  lg: styles.sizeLg,
  xl: styles.sizeXl,
};

export function Button(props: ButtonProps) {
  const [local, others] = splitProps(props, [
    'as',
    'theme',
    'size',
    'leftIcon',
    'class',
    'children',
    'type',
  ]);

  const component = () => (local.as === 'a' || others.href ? 'a' : 'button');
  const theme = () => local.theme ?? 'primary';
  const size = () => local.size ?? 'md';

  const className = () =>
    [styles.button, themeClassMap[theme()], sizeClassMap[size()], local.class]
      .filter(Boolean)
      .join(' ');

  return (
    <Dynamic
      component={component()}
      class={className()}
      type={component() === 'button' ? local.type ?? 'button' : undefined}
      {...others}
    >
      <Show when={local.leftIcon}>
        {leftIcon => <span class={styles.icon}>{leftIcon()}</span>}
      </Show>
      <span class={styles.label}>{local.children}</span>
    </Dynamic>
  );
}
