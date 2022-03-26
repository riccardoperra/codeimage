import {LionCombobox} from '@lion/combobox';
import {css, html, PropertyValues} from '@lion/core';
import {LionOption} from '@lion/listbox';
import '@lion/combobox/define';
import '@lion/listbox/define';

interface InlineComboboxEventMap extends HTMLElementEventMap {
  selectedItem: CustomEvent<{value: string}>;
}

class InlineCombobox extends LionCombobox {
  valueMapper?: (value: string) => string;
  placeholder: string | null | undefined;
  value: string | null | undefined;

  static get properties() {
    return {
      ...super.properties,
      placeholder: {type: String},
      value: {type: String},
    };
  }

  get hiddenValueNode(): HTMLSpanElement {
    return this.shadowRoot!.querySelector('span.inline__item')!;
  }

  get hiddenTextValue(): string {
    return this.value || this.placeholder || '';
  }

  static styles = [
    ...super.styles,
    css`
      :host {
        font-family: 'Inter', system-ui, -apple-system;
        display: inline-block;
        position: relative;
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
  }

  protected update(changedProperties: PropertyValues) {
    super.update(changedProperties);
    if (changedProperties.has('placeholder')) {
      if (this.placeholder) {
        this._inputNode.setAttribute('placeholder', this.placeholder);
      } else {
        this._inputNode.removeAttribute('placeholder');
      }
    }
    if (changedProperties.has('value')) {
      if (this._inputNode.value !== this.value) {
        this._setTextboxValue(this.value || '');
        setTimeout(() => this.recalculateWidth);
      } else {
        this.recalculateWidth();
      }
    }
  }

  private recalculateWidth(): void {
    this.style.setProperty(
      'width',
      `${this.hiddenValueNode.clientWidth + 10}px`,
    );
  }

  protected render(): unknown {
    return html`
      ${super.render()}
      <span class="inline__item">${this.hiddenTextValue}</span>
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
    'cmg-combobox-option': InlineCombobox;
  }
}
