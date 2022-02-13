import * as styles from './SegmentedField.css';
import {Component, createMemo, For} from 'solid-js';
import clsx from 'clsx';
import {useText, UseTextProps} from '../Text/useText';
import {assignInlineVars} from '@vanilla-extract/dynamic';

interface SegmentedFieldItem<T> {
  label: string;
  value: T;
}

interface SegmentedFieldProps<T> {
  value: T;
  onChange: (value: T) => void;
  items: readonly SegmentedFieldItem<T>[];
  size?: UseTextProps['size'];
  class: string;
}

export const SegmentedField: Component<SegmentedFieldProps<any>> = props => {
  const segmentWidth = createMemo(() => `calc(100% / ${props.items.length})`);

  const activeIndex = createMemo(() =>
    props.items.findIndex(item => item.value === props.value),
  );

  const activeSegmentOffset = createMemo(
    () => `calc(${segmentWidth()} * ${activeIndex()})`,
  );

  const segmentStyle = createMemo(() =>
    clsx(useText({size: props.size ?? 'sm'}), styles.segment),
  );

  return (
    <div class={clsx(styles.wrapper, props.class)}>
      <div class={styles.box}>
        <div
          style={assignInlineVars({
            [styles.segmentedFieldVars.activeSegmentedWidth]: segmentWidth(),
            [styles.segmentedFieldVars.activeSegmentedOffset]:
              activeSegmentOffset(),
          })}
          class={clsx(styles.segmentActive)}
        />
        <For each={props.items}>
          {(item, index) => (
            <a
              class={segmentStyle()}
              data-active={index() === activeIndex()}
              onClick={() => props.onChange(item.value)}
            >
              {item.label}
            </a>
          )}
        </For>
      </div>
    </div>
  );
};
