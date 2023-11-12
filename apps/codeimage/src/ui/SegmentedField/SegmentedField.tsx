import {
  SegmentedControl,
  SegmentedControlItem,
  SegmentedControlProps,
} from '@codeui/kit';
import {For, JSX, JSXElement} from 'solid-js';

/**
 * @deprecated This is just a wrapper for @codeui/kit SegmentedField
 */
export interface SegmentedFieldItem<T> {
  label: string | JSXElement;
  value: T;
}

/**
 * @deprecated This is just a wrapper for @codeui/kit SegmentedField
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
 * @deprecated This is just a wrapper for @codeui/kit SegmentedField
 * @param props
 * @constructor
 */
export function SegmentedField<T>(props: SegmentedFieldProps<T>): JSX.Element {
  const value = (): string => {
    const index = props.items.findIndex(item => item.value === props.value);
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
