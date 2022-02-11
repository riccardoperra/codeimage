import {Dynamic} from 'solid-js/web';
import {Component, createMemo} from 'solid-js';
import {
  DynamicProps,
  ValidConstructor,
  WithRef,
} from 'solid-headless/dist/types/utils/dynamic-prop';
import {omitProps} from 'solid-use';
import {useText, UseTextProps} from './useText';

type TextProps<T extends ValidConstructor = 'span'> = {
  as?: T | ValidConstructor;
} & WithRef<T> &
  Omit<DynamicProps<T>, 'as' | 'ref'> & {
    size?: UseTextProps['size'];
    weight?: UseTextProps['weight'];
  };

export const Text: Component<TextProps> = props => {
  const textStyles = createMemo(() =>
    useText({size: props.size, weight: props.weight}),
  );

  return (
    <Dynamic
      component={props.as ?? 'span'}
      class={`${textStyles()} ${props.class || ''}`}
      {...omitProps(props, ['as', 'children'])}
    >
      {props.children}
    </Dynamic>
  );
};
