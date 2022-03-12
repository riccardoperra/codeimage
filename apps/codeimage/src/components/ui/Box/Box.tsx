import {Dynamic} from 'solid-js/web';
import {sprinkles} from '../../../theme/sprinkles.css';
import {
  DynamicProps,
  ValidConstructor,
  WithRef,
} from 'solid-headless/dist/types/utils/dynamic-prop';
import {omitProps, pickProps} from 'solid-use';
import clsx from 'clsx';
import {scrollbar} from '../../../theme/base.css';

type BoxParameters = Parameters<typeof sprinkles>[0];

export type BoxProps<T extends ValidConstructor = 'div'> =
  Partial<BoxParameters> & {
    as?: T;
  } & WithRef<T> &
    Omit<DynamicProps<T>, 'as' | 'disabled' | 'ref'>;

export function Box<T extends ValidConstructor = 'div'>(props: BoxProps<T>) {
  return (
    <Dynamic
      component={props.as ?? 'div'}
      ref={props.ref}
      {...omitProps(props, ['as', 'ref'])}
      class={clsx(
        scrollbar,
        props.class,
        sprinkles(pickProps(props, [...sprinkles.properties.keys()])),
      )}
    >
      {props.children}
    </Dynamic>
  );
}
