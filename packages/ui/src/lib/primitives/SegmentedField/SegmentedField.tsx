import * as styles from './SegmentedField.css';
import {createMemo, For, JSX} from 'solid-js';
import clsx from 'clsx';
import {assignInlineVars} from '@vanilla-extract/dynamic';
import {useText, UseTextProps} from '../Text';
import {Box} from '../Box';

export interface SegmentedFieldItem<T> {
  label: string;
  value: T;
}

interface SegmentedFieldProps<T> {
  value: T;
  onChange: (value: T) => void;
  items: readonly SegmentedFieldItem<T>[];
  size?: UseTextProps['size'];
  id?: string;
}

export function SegmentedField<T>(props: SegmentedFieldProps<T>): JSX.Element {
  const segmentWidth = createMemo(() => `calc(100% / ${props.items.length})`);

  const activeIndex = createMemo(() =>
    props.items.findIndex(item => item.value === props.value),
  );

  const activeSegmentOffset = createMemo(
    () => `calc(${segmentWidth()} * ${activeIndex()})`,
  );

  const segmentStyle = createMemo(() => useText({size: props.size ?? 'sm'}));

  return (
    <Box class={clsx(styles.wrapper)} id={props.id}>
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
            <Box
              class={clsx(styles.segment, segmentStyle())}
              data-active={index() === activeIndex()}
              onClick={() => props.onChange(item.value)}
            >
              {item.label}
            </Box>
          )}
        </For>
      </div>
    </Box>
  );
}
