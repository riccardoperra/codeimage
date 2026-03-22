import type {ElementType} from '@solid-aria/types';
import clsx from 'clsx';
import type {JSXElement, ParentProps, Ref} from 'solid-js';
import {splitProps} from 'solid-js';
import {Dynamic, type DynamicProps} from 'solid-js/web';
import type {UseTextProps} from './useText';
import {useText} from './useText';

export type TextComponentProps = {
  size?: UseTextProps['size'];
  weight?: UseTextProps['weight'];
};

export type TextProps<T extends ElementType = 'span'> = TextComponentProps & {
  as?: T | ElementType;
  innerHTML?: JSXElement | string;
  ref?: Ref<T>;
} & Omit<DynamicProps<T>, 'ref' | 'as'>;

export function Text<T extends ElementType = 'span'>(
  props: ParentProps<TextProps<T>>,
): JSXElement {
  // @ts-expect-error TODO: find why class is not present
  const [local, others] = splitProps(props, ['as', 'class']);
  const textClasses = useText(props);

  return (
    <Dynamic
      component={local.as ?? 'span'}
      class={clsx(textClasses(), local.class)}
      {...others}
    >
      {props.children}
    </Dynamic>
  );
}
