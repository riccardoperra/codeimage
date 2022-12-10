import {ElementType} from '@solid-aria/types';
import clsx from 'clsx';
import type {
  DynamicProps,
  WithRef,
} from 'solid-headless/dist/types/utils/dynamic-prop';
import type {JSXElement, PropsWithChildren} from 'solid-js';
import {omitProps, pickProps} from 'solid-use';
import {sprinkles, Sprinkles} from '../../theme';
import {styled} from '../../utils';
import {boxBase} from './Box.css';

type BoxParameters = {
  // Fallback to support both index number and string (ex. 2 | "2")
  [key in keyof Sprinkles]: Sprinkles[key] | `${Sprinkles[key] & number}`;
};

export type BoxProps<T extends ElementType = 'div'> = Partial<BoxParameters> & {
  as?: T;
} & WithRef<T> &
  Omit<DynamicProps<T>, 'as' | 'disabled' | 'ref'>;

export function Box<T extends ElementType = 'div'>(
  props: PropsWithChildren<BoxProps<T>>,
): JSXElement {
  return (
    <styled.div
      {...omitProps(props, ['as', 'ref'])}
      as={props.as ?? 'div'}
      ref={props.ref}
      class={clsx(
        boxBase,
        props.class,
        sprinkles(pickProps(props, [...sprinkles.properties.keys()])),
      )}
    >
      {props.children}
    </styled.div>
  );
}
