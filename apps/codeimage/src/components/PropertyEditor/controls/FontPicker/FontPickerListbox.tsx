import {Listbox} from '@codeui/kit';

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
    itemLabel: item => (
      <span
        style={{
          'font-family': `${item.label}, monospace`,
          'font-size': '80%',
        }}
      >
        {item.label}
      </span>
    ),
    get value() {
      return [props.value];
    },
    onChange: values => props.onChange(values.keys().next().value),
  } satisfies Parameters<typeof Listbox<Item>>[0];
};
