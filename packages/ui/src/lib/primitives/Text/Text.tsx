import clsx from 'clsx';
import {
  DynamicProps,
  ValidConstructor,
  WithRef,
} from 'solid-headless/dist/types/utils/dynamic-prop';
import {JSXElement, mergeProps, ParentProps} from 'solid-js';
import {Dynamic} from 'solid-js/web';
import {omitProps} from 'solid-use';
import {useTheme} from '../../tokens';
import {useText, UseTextProps} from './useText';

export type TextComponentProps = {
  size?: UseTextProps['size'];
  weight?: UseTextProps['weight'];
};

export type TextProps<T extends ValidConstructor = 'span'> = {
  as?: T | ValidConstructor;
} & WithRef<T> &
  Omit<DynamicProps<T>, 'as' | 'ref'> &
  TextComponentProps;

export function Text<T extends ValidConstructor>(
  props: ParentProps<TextProps<T>>,
): JSXElement {
  const baseTheme = useTheme().text;
  const defaultProps = {weight: baseTheme.weight, size: baseTheme.size};
  const propsWithDefault = mergeProps(defaultProps, props);

  const classes = () =>
    clsx(
      props.class,
      useText({
        size: propsWithDefault.size,
        weight: propsWithDefault.weight,
      }),
    );

  return (
    <Dynamic
      component={props.as ?? 'span'}
      {...omitProps(props, ['as', 'children'])}
      class={classes()}
    >
      {props.children}
    </Dynamic>
  );
}
