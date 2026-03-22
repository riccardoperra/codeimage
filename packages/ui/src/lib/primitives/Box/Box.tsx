import type {ElementType} from '@solid-aria/types';
import clsx from 'clsx';
import type {JSX, JSXElement, ParentProps, Ref} from 'solid-js';
import {omitProps, pickProps} from 'solid-use/props';
import type {Sprinkles} from '../../theme';
import {sprinkles} from '../../theme';
import {styled} from '../../utils';
import {boxBase} from './Box.css';

type UnboxIntrinsicElements<T> =
  T extends JSX.HTMLAttributes<infer U> ? U : never;

type UnboxComponentProp<U> = U extends {ref: infer X} ? X : never;

export type DynamicNode<T extends ValidConstructor> = T extends ValidElements
  ? UnboxIntrinsicElements<JSX.IntrinsicElements[T]>
  : T extends ValidComponent<infer U>
    ? UnboxComponentProp<U>
    : never;

export type ValidElements = keyof JSX.IntrinsicElements;
export type ValidComponent<P> = (props: P) => JSX.Element;
export type ValidConstructor =
  | ValidElements
  // oxlint-disable-next-line typescript/no-explicit-any
  | ValidComponent<any>
  | (string & {});

export type DynamicProps<T extends ValidConstructor> = T extends ValidElements
  ? JSX.IntrinsicElements[T]
  : T extends ValidComponent<infer U>
    ? U
    : Record<string, unknown>;

type BoxParameters = {
  // Fallback to support both index number and string (ex. 2 | "2")
  [key in keyof Sprinkles]: Sprinkles[key] | `${Sprinkles[key] & number}`;
};

export type BoxProps<T extends ElementType = 'div'> = Partial<BoxParameters> & {
  as?: T;
  ref?: Ref<DynamicNode<T>>;
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
