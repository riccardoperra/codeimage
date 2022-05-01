import {Dynamic} from 'solid-js/web';
import {createMemo, JSXElement, mergeProps} from 'solid-js';
import {
  DynamicProps,
  ValidConstructor,
  WithRef,
} from 'solid-headless/dist/types/utils/dynamic-prop';
import {omitProps} from 'solid-use';
import {useTheme} from '../../tokens';
import {useText, UseTextProps} from './useText';
import {PropsWithChildren} from 'solid-js/types/render/component';

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
  props: PropsWithChildren<TextProps<T>>,
): JSXElement {
  const baseTheme = useTheme();
  const computedProps = mergeProps(baseTheme.text, props);

  const textStyles = createMemo(() =>
    useText({size: computedProps.size, weight: computedProps.weight}),
  );

  return (
    <Dynamic
      component={props.as ?? 'span'}
      {...omitProps(props, ['as', 'children'])}
      class={`${textStyles()} ${props.class || ''}`}
    >
      {props.children}
    </Dynamic>
  );
}
