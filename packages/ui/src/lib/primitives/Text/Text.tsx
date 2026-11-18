import clsx from 'clsx';
import type {Element as JSXElement, ParentProps, Ref} from 'solid-js';
import {omit} from 'solid-js';
import {Dynamic} from '@solidjs/web';
import type {DynamicNode, DynamicProps, ValidConstructor} from '../Box/Box';
import type {UseTextProps} from './useText';
import {useText} from './useText';

export type TextComponentProps = {
  size?: UseTextProps['size'];
  weight?: UseTextProps['weight'];
};

export type TextProps<T extends ValidConstructor = 'span'> =
  TextComponentProps & {
    as?: T;
    class?: string;
    innerHTML?: JSXElement | string;
    ref?: Ref<DynamicNode<T>>;
  } & Omit<DynamicProps<T>, 'ref' | 'as'>;

export function Text<T extends ValidConstructor = 'span'>(
  props: ParentProps<TextProps<T>>,
): JSXElement {
  const others = omit(props, 'as', 'class');
  const textClasses = useText(props);

  return (
    <Dynamic
      component={props.as ?? 'span'}
      class={clsx(textClasses(), props.class)}
      {...others}
    >
      {props.children}
    </Dynamic>
  );
}
