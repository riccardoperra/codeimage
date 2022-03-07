import {Dynamic} from 'solid-js/web';
import {createMemo, JSXElement} from 'solid-js';
import {
  DynamicProps,
  ValidConstructor,
  WithRef,
} from 'solid-headless/dist/types/utils/dynamic-prop';
import {omitProps} from 'solid-use';
import {useText, UseTextProps} from './useText';
import {PropsWithChildren} from 'solid-js/types/render/component';

export type TextProps<T extends ValidConstructor = 'span'> = {
  as?: T | ValidConstructor;
} & WithRef<T> &
  Omit<DynamicProps<T>, 'as' | 'ref'> & {
    size?: UseTextProps['size'];
    weight?: UseTextProps['weight'];
  };

export function Text<T extends ValidConstructor>(
  props: PropsWithChildren<TextProps<T>>,
): JSXElement {
  const textStyles = createMemo(() =>
    useText({size: props.size, weight: props.weight}),
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
