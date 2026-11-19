import type {ListboxProps} from '@ui/legacy-listbox';
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
    optionValue: item => item.value,
    optionTextValue: item => item.label,
    itemLabel: item => {
      const label = document.createElement('span');
      label.className = fontOption;
      label.style.fontFamily = `${item.label}, monospace`;
      label.textContent = item.label;
      return label;
    },
    get value() {
      return [props.value];
    },
    onChange: values => {
      const option = values.values().next().value;
      if (option !== undefined) props.onChange(option);
    },
  } satisfies ListboxProps<Item>;
};
