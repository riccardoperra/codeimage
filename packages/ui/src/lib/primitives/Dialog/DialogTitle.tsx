import clsx from 'clsx';
import {
  DialogTitle as ShDialogTitle,
  DialogTitleProps as ShDialogTitleProps,
} from 'solid-headless';

import * as styles from './Dialog.css';
import {JSXElement} from 'solid-js';
import {omitProps} from 'solid-use';
import {ValidConstructor} from 'solid-headless/dist/types/utils/dynamic-prop';

export type DialogTitleProps<T extends ValidConstructor> =
  ShDialogTitleProps<T>;

export function DialogTitle<T extends ValidConstructor>(
  props: DialogTitleProps<T>,
): JSXElement {
  return (
    <ShDialogTitle
      as="h3"
      {...omitProps(props, ['children'])}
      class={clsx(styles.title, props.class)}
    >
      {props.children}
    </ShDialogTitle>
  );
}
