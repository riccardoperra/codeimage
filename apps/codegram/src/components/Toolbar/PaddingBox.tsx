import {Component, For} from 'solid-js';
import * as styles from './PaddingBox.css';

interface PaddingBoxProps {
  selected: number;
  sizes: number[];
  onChange: (size: number) => void;
}

export const PaddingBox: Component<PaddingBoxProps> = props => {
  return (
    <div class={styles.container}>
      Padding
      <div class={styles.itemContainer}>
        <For each={props.sizes}>
          {item => (
            <span
              onClick={() => props.onChange(item)}
              class={styles.item({
                active: props.selected === item,
              })}
            >
              {item}
            </span>
          )}
        </For>
      </div>
    </div>
  );
};
