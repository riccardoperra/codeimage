import * as styles from './SegmentedField.css';
import {
  createMemo,
  createSignal,
  For,
  JSX,
  JSXElement,
  on,
  onCleanup,
  onMount,
} from 'solid-js';
import clsx from 'clsx';
import {assignInlineVars} from '@vanilla-extract/dynamic';
import {useText, UseTextProps} from '../Text';
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

  onMount(() => {
    const observer = new ResizeObserver(([entry]) =>
      requestAnimationFrame(() => setWidth(entry.target.clientWidth)),
    );
    observer.observe(container() as HTMLElement);
    return onCleanup(() => observer.disconnect());
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

  const segmentWidth = createMemo(
    on([width, activeItem], ([, activeItem]) => {
      if (!activeItem) {
        return `calc(100% / ${props.items.length})`;
      }
      return `${activeItem.clientWidth}px`;
    }),
  );

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
