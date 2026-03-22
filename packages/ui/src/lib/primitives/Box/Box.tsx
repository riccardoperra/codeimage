import type {ElementType} from '@solid-aria/types';
import clsx from 'clsx';
import type {JSXElement, ParentProps, Ref} from 'solid-js';
import type {DynamicProps} from 'solid-js/web';
import {omitProps, pickProps} from 'solid-use/props';
import type {Sprinkles} from '../../theme';
import {sprinkles} from '../../theme';
import {styled} from '../../utils';
import {boxBase} from './Box.css';

type BoxParameters = {
  // Fallback to support both index number and string (ex. 2 | "2")
  [key in keyof Sprinkles]: Sprinkles[key] | `${Sprinkles[key] & number}`;
};

export type BoxProps<T extends ElementType = 'div'> = Partial<BoxParameters> & {
  as?: T;
  ref?: Ref<T>;
} & Omit<DynamicProps<T>, 'as' | 'disabled' | 'ref'>;

export function Box<T extends ElementType = 'div'>(
  props: ParentProps<BoxProps<T>>,
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
