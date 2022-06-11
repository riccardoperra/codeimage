import '@lion/listbox/define-option';
import '@lion/combobox/define';
import {ComboboxOption, InlineCombobox} from './InlineCombobox';
customElements.define('cmg-inline-combobox', InlineCombobox);
customElements.define('cmg-combobox-option', ComboboxOption);

export {InlineCombobox, ComboboxOption};

declare module 'solid-js' {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      'cmg-inline-combobox': Partial<
        InlineCombobox &
          JSX.DOMAttributes<InlineCombobox> & {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            children: any;
            class: string;
            'prop:_noTypeAhead': InlineCombobox['_noTypeAhead'];
            'prop:valueMapper': InlineCombobox['valueMapper'];
            'prop:autocomplete': InlineCombobox['autocomplete'];
            'on:selectedItemChange': (
              event: CustomEvent<{value: string}>,
            ) => void;
            'on:inputTextChange': (event: CustomEvent<{value: string}>) => void;
          }
      >;
      'cmg-combobox-option': Partial<
        ComboboxOption &
          JSX.DOMAttributes<ComboboxOption> & {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            children: any;
            class: string;
            'prop:choiceValue': ComboboxOption['choiceValue'];
          }
      >;
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'cmg-inline-combobox': InlineCombobox;
    'cmg-combobox-option': ComboboxOption;
  }
}
