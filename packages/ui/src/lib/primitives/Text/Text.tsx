import {ElementType} from '@solid-aria/types';
import clsx from 'clsx';
import {
  DynamicProps,
  WithRef,
} from 'solid-headless/dist/types/utils/dynamic-prop';
import {JSXElement, ParentProps, splitProps} from 'solid-js';
import {Dynamic} from 'solid-js/web';
import {useText, UseTextProps} from './useText';

export type TextComponentProps = {
  size?: UseTextProps['size'];
  weight?: UseTextProps['weight'];
};

export type TextProps<T extends ElementType = 'span'> = TextComponentProps & {
  as?: T | ElementType;
  innerHTML?: JSXElement | string;
} & WithRef<T> &
  Omit<DynamicProps<T>, 'ref' | 'as'>;

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
