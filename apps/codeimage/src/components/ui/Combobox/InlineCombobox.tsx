import {LionCombobox} from '@lion/combobox';
import {css, html, PropertyValues} from '@lion/core';
import {LionOption} from '@lion/listbox';
import '@lion/combobox/define';
import '@lion/listbox/define';
import {SlotsMap} from '@lion/core/types/SlotMixinTypes';

interface InlineComboboxEventMap extends HTMLElementEventMap {
  selectedItem: CustomEvent<{value: string}>;
}

export class InlineCombobox extends LionCombobox {
  _placeholder: string | null | undefined;

  valueMapper?: (value: string) => string;

  static get properties() {
    return {
      ...super.properties,
      textValue: String,
      placeholder: String,
    };
  }

  get textValue() {
    return this._inputNode.value || this.placeholder;
  }

  get hiddenValueNode(): HTMLSpanElement {
    return this.shadowRoot!.querySelector('span.inline__item')!;
  }

  get placeholder(): string {
    return this._placeholder ?? '';
  }

  set placeholder(placeholder: string | null | undefined) {
    this._placeholder = placeholder;

    if (placeholder) {
      this._inputNode.setAttribute('placeholder', placeholder);
    } else {
      this._inputNode.removeAttribute('placeholder');
    }
  }

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

      .inline__item {
        visibility: hidden;
        display: inline-block;
        height: 0;
        position: absolute;
      }
    `,
  ];

  connectedCallback() {
    super.connectedCallback();

    setTimeout(() =>
      this.style.setProperty(
        'width',
        `${this.hiddenValueNode.clientWidth + 10}px`,
      ),
    );

    this._inputNode.addEventListener('input', () => {
      setTimeout(() => {
        this.style.setProperty(
          'width',
          `${this.hiddenValueNode.clientWidth + 10}px`,
        );
      });
    });
  }

  protected update(changedProperties: PropertyValues) {
    super.update(changedProperties);
  }

  get slots(): SlotsMap {
    return {
      ...super.slots,
    };
  }

  protected render(): unknown {
    return html`
      ${super.render()}
      <span class="inline__item">${this.textValue}</span>
    `;
  }

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
