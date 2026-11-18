import * as styles from './SegmentedField.css';
import type {JSX} from '@solidjs/web';
import type {Element as JSXElement} from 'solid-js';
import {createEffect, createMemo, createSignal, For} from 'solid-js';
import clsx from 'clsx';
import {assignInlineVars} from '@vanilla-extract/dynamic';
import type {UseTextProps} from '../Text';
import {useText} from '../Text';
import {Box} from '../Box';

export interface SegmentedFieldItem<T> {
  label: string | JSXElement;
  value: T;
}

interface SegmentedFieldProps<T> {
  items: readonly SegmentedFieldItem<T>[];
  value: T;
  onChange?: (value: T) => void;
  size?: UseTextProps['size'];
  id?: string;
}

export function SegmentedField<T>(props: SegmentedFieldProps<T>): JSX.Element {
  const [container, setContainer] = createSignal<HTMLDivElement>();
  const [width, setWidth] = createSignal(0);

  createEffect(container, containerValue => {
    if (!containerValue) return;
    setWidth(containerValue.clientWidth);

    let frame = 0;
    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => setWidth(containerValue.clientWidth));
    });
    observer.observe(containerValue);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  });

  const activeIndex = createMemo(() =>
    props.items.findIndex(item => item.value === props.value),
  );

  const activeItem = createMemo(() => {
    const ref = container();
    if (!ref) return undefined;
    return ref.querySelectorAll('[data-index]').item(activeIndex()) as
      | HTMLElement
      | undefined;
  });

  const segmentWidth = createMemo(() => {
    width();
    const item = activeItem();
    return item
      ? `${item.clientWidth}px`
      : `calc(100% / ${props.items.length})`;
  });

  const activeSegmentOffset = () => {
    const item = activeItem();
    if (!item) {
      return `calc(${segmentWidth()} * ${activeIndex()})`;
    }
    return `${item.offsetLeft}px`;
  };

  const segmentedTextStyle = useText(props);

  return (
    <Box class={clsx(styles.wrapper)} id={props.id}>
      <div class={styles.box} ref={setContainer}>
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
            <div
              data-index={index()}
              class={clsx(styles.segment, segmentedTextStyle())}
              data-active={index() === activeIndex()}
              onClick={() => props.onChange?.(item.value)}
            >
              {item.label}
            </div>
          )}
        </For>
      </div>
    </Box>
  );
}
