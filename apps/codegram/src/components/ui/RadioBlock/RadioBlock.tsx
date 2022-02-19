import * as styles from './RadioBlock.css';
import {RadioBlockVariants} from './RadioBlock.css';
import {JSXElement} from 'solid-js';

export type RadioBlockProps<T> = RadioBlockVariants & {
  value: T;
  onSelect?: (value: T) => void;
  children?: JSXElement;
};

export function RadioBlock<T>(props: RadioBlockProps<T>) {
  return (
    <div
      class={styles.radioBlock({
        selected: props.selected,
      })}
      onClick={() => props.onSelect?.(props.value)}
    >
      {props.children}
    </div>
  );
}
