import {
  SegmentedControl,
  SegmentedControlItem,
  type SegmentedControlProps,
} from '@codeui/kit';
import type {JSX} from '@solidjs/web';
import {For, type Element as JSXElement} from 'solid-js';

export interface SegmentedFieldItem<T> {
  label: JSXElement;
  value: T;
}

interface SegmentedFieldProps<T> {
  items: readonly SegmentedFieldItem<T>[];
  itemClass?: string;
  value: T;
  onChange?: (value: T) => void;
  onEscape?: () => void;
  size?: SegmentedControlProps['size'];
  id?: string;
  adapt?: boolean;
  autoWidth?: boolean;
}

export function SegmentedField<T>(props: SegmentedFieldProps<T>): JSX.Element {
  const selected = () =>
    Math.max(
      0,
      props.items.findIndex(item => item.value === props.value),
    );

  return (
    <SegmentedControl
      id={props.id}
      size={props.size ?? 'sm'}
      fluid={props.adapt}
      autoWidth={props.adapt || props.autoWidth}
      classes={{item: props.itemClass}}
      value={String(selected())}
      onChange={value => {
        const item = props.items[Number(value)];
        if (item) props.onChange?.(item.value);
      }}
      onEscapeKeyDown={event => {
        if (!props.onEscape) return;
        event.preventDefault();
        props.onEscape();
      }}
    >
      <For each={props.items} keyed={item => item.value}>
        {(item, index) => (
          <SegmentedControlItem value={String(index())}>
            {item().label}
          </SegmentedControlItem>
        )}
      </For>
    </SegmentedControl>
  );
}
