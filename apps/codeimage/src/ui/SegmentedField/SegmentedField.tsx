import {
  SegmentedControl,
  SegmentedControlItem,
  type SegmentedControlProps,
} from '@codeui/kit';
import {For, type JSX, type JSXElement} from 'solid-js';

/**
 * TODO: port SegmentedControl with items support
 * @deprecated This is just a wrapper for @codeui/kit SegmentedControl
 */
export interface SegmentedFieldItem<T> {
  label: string | JSXElement;
  value: T;
}

/**
 * TODO: port SegmentedControl with items support
 * @deprecated This is just a wrapper for @codeui/kit SegmentedControl
 */
interface SegmentedFieldProps<T> {
  items: readonly SegmentedFieldItem<T>[];
  value: T;
  onChange?: (value: T) => void;
  size?: SegmentedControlProps['size'];
  id?: string;

  adapt?: boolean;
  autoWidth?: boolean;
}

/**
 * TODO: port SegmentedControl with items support
 * @deprecated This is just a wrapper for @codeui/kit SegmentedControl
 */
export function SegmentedField<T>(props: SegmentedFieldProps<T>): JSX.Element {
  const value = (): string => {
    const index = props.items.findIndex(item => item.value === props.value);
    if (index === -1) return String(0);
    return String(index);
  };

  const onChange = (value: string) => {
    const index = parseInt(value, 10);
    props.onChange?.(props.items[index]?.value);
  };

  return (
    <SegmentedControl
      value={value()}
      onChange={onChange}
      fluid={props.adapt}
      autoWidth={props.adapt || props.autoWidth}
      size={props.size ?? 'sm'}
    >
      <For each={props.items}>
        {(item, index) => (
          <SegmentedControlItem value={index().toString()}>
            {item.label}
          </SegmentedControlItem>
        )}
      </For>
    </SegmentedControl>
  );
}
