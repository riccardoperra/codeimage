import type {ListboxProps} from '@codeui/kit';
import {fontOption} from './FontPicker.css';

interface FontPickerListboxProps {
  onEsc: () => void;
  value: string;
  onChange: (value: string) => void;
  items: Item[];
}

type Item = {label: string; value: string};

export const createFontPickerListboxProps = (props: FontPickerListboxProps) => {
  return {
    autoFocus: true,
    shouldFocusWrap: false,
    selectionMode: 'single',
    size: 'sm',
    disallowEmptySelection: true,
    onKeyDown: evt => {
      if (evt.key === 'Escape') {
        props.onEsc();
      }
    },
    get options() {
      return props.items;
    },
    optionValue: 'value',
    optionTextValue: 'label',
    itemLabel: item => (
      <span
        class={fontOption}
        style={{'font-family': `${item.label}, monospace`}}
      >
        {item.label}
      </span>
    ),
    get value() {
      return [props.value];
    },
    onChange: values => {
      const option = values.values().next().value;
      if (option !== undefined) props.onChange(option);
    },
  } satisfies ListboxProps<Item, never>;
};
