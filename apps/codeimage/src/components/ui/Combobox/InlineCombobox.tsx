import {LionCombobox} from '@lion/combobox';
import {css} from '@lion/core';
import {LionOption} from '@lion/listbox';
import '@lion/combobox/define';
import '@lion/listbox/define';

interface InlineComboboxEventMap extends HTMLElementEventMap {
  selectedItem: CustomEvent<{value: string}>;
}

export class InlineCombobox extends LionCombobox {
  valueMapper?: (value: string) => string;

  static styles = [
    ...super.styles,
    css`
      :host {
        font-family: 'Inter', system-ui, -apple-system;
        display: inline-block;
      }

      .input-group__container {
        border: none;
      }
    `,
  ];

  addEventListener<K extends keyof InlineComboboxEventMap>(
    type: K,
    listener: (this: HTMLElement, ev: InlineComboboxEventMap[K]) => void,
    options?: boolean | AddEventListenerOptions,
  ): void;
  addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions,
  ): void {
    return super.addEventListener(type, listener, options);
  }

  removeEventListener<K extends keyof InlineComboboxEventMap>(
    type: K,
    listener: (this: HTMLElement, ev: InlineComboboxEventMap[K]) => void,
    options?: boolean | EventListenerOptions,
  ): void;
  removeEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | EventListenerOptions,
  ): void {
    return super.removeEventListener(type, listener, options);
  }

  _getTextboxValueFromOption(option: ComboboxOption) {
    if (this.valueMapper) {
      return this.valueMapper(option.choiceValue);
    }
    return option.choiceValue;
  }

  protected _listboxOnKeyDown(ev: KeyboardEvent) {
    const {key} = ev;
    if (this.opened && key === 'Enter' && this.activeIndex !== -1) {
      const value = this._getTextboxValueFromOption(
        this.formElements[this.activeIndex],
      );
      this.dispatchEvent(new CustomEvent('selectedItem', {detail: {value}}));
    }

    super._listboxOnKeyDown(ev);
  }
}

class ComboboxOption extends LionOption {
  protected createRenderRoot(): Element | ShadowRoot {
    return this;
  }
}

customElements.define('cmg-inline-combobox', InlineCombobox);
customElements.define('cmg-combobox-option', ComboboxOption);

declare module 'solid-js' {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      'cmg-inline-combobox': Partial<
        InlineCombobox & JSX.DOMAttributes<InlineCombobox> & {children: any}
      >;
      'cmg-combobox-option': Partial<
        ComboboxOption & JSX.DOMAttributes<ComboboxOption> & {children: any}
      >;
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'cmg-inline-combobox': InlineCombobox;
  }
}
