import clsx from 'clsx';
import {
  DynamicProps,
  ValidConstructor,
  WithRef,
} from 'solid-headless/dist/types/utils/dynamic-prop';
import {JSXElement, ParentProps} from 'solid-js';
import {Dynamic} from 'solid-js/web';
import {omitProps} from 'solid-use';
import {useTheme} from '../../tokens';
import {mergeProps2} from '../../utils/types';
import {useText, UseTextProps} from './useText';

export type TextComponentProps = {
  size?: UseTextProps['size'];
  weight?: UseTextProps['weight'];
};

export type TextProps<T extends ValidConstructor = 'span'> = {
  as?: T | ValidConstructor;
} & WithRef<T> &
  Omit<DynamicProps<T>, 'ref' | 'as'> &
  TextComponentProps;

export function Text<T extends ValidConstructor = 'span'>(
  props: ParentProps<TextProps<T>>,
): JSXElement {
  const baseTheme = useTheme().text;
  const defaultProps = {weight: baseTheme.weight, size: baseTheme.size};
  const propsWithDefault = mergeProps2(defaultProps, props);

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
