import clsx from 'clsx';
import {
  type DynamicProps,
  type ValidConstructor,
  type WithRef,
} from 'solid-headless/dist/types/utils/dynamic-prop';
import {type JSXElement, type PropsWithChildren} from 'solid-js';
import {omitProps, pickProps} from 'solid-use';
import {sprinkles, Sprinkles} from '../../theme';
import {styled} from '../../utils';
import {boxBase} from './Box.css';

type BoxParameters = Sprinkles;

export type BoxProps<T extends ValidConstructor = 'div'> =
  Partial<BoxParameters> & {
    as?: T;
  } & WithRef<T> &
    Omit<DynamicProps<T>, 'as' | 'disabled' | 'ref'>;

export function Box<T extends ValidConstructor = 'div'>(
  props: PropsWithChildren<BoxProps<T>>,
): JSXElement {
  return (
    <styled.div
      as={props.as ?? 'div'}
      ref={props.ref}
      {...omitProps(props, ['as', 'ref'])}
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
