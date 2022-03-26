import {LionCombobox} from '@lion/combobox';
import {css, html, PropertyValues} from '@lion/core';
import {LionOption} from '@lion/listbox';
import '@lion/combobox/define';
import '@lion/listbox/define';

interface InlineComboboxEventMap extends HTMLElementEventMap {
  selectedItem: CustomEvent<{value: string}>;
}

export class InlineCombobox extends LionCombobox {
  valueMapper?: (value: string) => string;
  placeholder: string | null | undefined;
  value: string | null | undefined;

  readonly observer = new ResizeObserver(observe => {
    const {width} = observe[0].contentRect;
    this.recalculateWidth(width);
  });

  static get properties() {
    return {
      ...super.properties,
      placeholder: {type: String},
      value: {type: String},
    };
  }

  get hiddenValueNode(): HTMLSpanElement | null {
    return this.shadowRoot?.querySelector('div.inline__item') ?? null;
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
    this.config = {
      placementMode: 'global',
      isTooltip: false,
      isBlocking: false,
    };

    setTimeout(() => {
      if (this.hiddenValueNode) {
        this.observer.observe(this.hiddenValueNode);
      }
    });
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

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this.hiddenValueNode) {
      this.observer.unobserve(this.hiddenValueNode);
    }
  }

  _getTextboxValueFromOption(option: ComboboxOption) {
    if (this.valueMapper) {
      return this.valueMapper(option.choiceValue);
    }
    return option.choiceValue;
  }

  protected _setTextboxValue(value: string) {
    super._setTextboxValue(value);
    this.dispatchEvent(new CustomEvent('inputTextChange', {detail: {value}}));
  }

  /**
   * ATTENTION: override overlay to append content into scaffold and inherit styles
   * @param config
   * @protected
   */
  protected _defineOverlay(
    config: Parameters<LionCombobox['_defineOverlay']>[0],
  ): ReturnType<LionCombobox['_defineOverlay']> {
    const controller = super._defineOverlay(config);
    const portalHost = document.querySelector('#portal-host');
    if (portalHost) {
      portalHost.appendChild(controller.content);
    }
    return controller;
  }

  protected update(changedProperties: PropertyValues) {
    if (changedProperties.has('placeholder')) {
      if (this.placeholder) {
        this._inputNode.setAttribute('placeholder', this.placeholder);
      } else {
        this._inputNode.removeAttribute('placeholder');
      }
    }
    if (changedProperties.has('value')) {
      this._setTextboxValue(this.value ?? '');
    }

    super.update(changedProperties);
  }

  private recalculateWidth(width: number): void {
    if (this.hiddenValueNode) {
      this.style.setProperty('width', `${width + 10}px`);
    }
  }

  protected render(): unknown {
    return html`
      ${super.render()}
      <div class="inline__item">${this.hiddenTextValue}</div>
    `;
  }

  protected _listboxOnKeyDown(ev: KeyboardEvent) {
    const {key} = ev;
    if (this.opened && key === 'Enter' && this.activeIndex !== -1) {
      const value = this._getTextboxValueFromOption(
        this.formElements[this.activeIndex],
      );
      this.dispatchEvent(
        new CustomEvent('selectedItemChange', {detail: {value}}),
      );
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
        InlineCombobox &
          JSX.DOMAttributes<InlineCombobox> & {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            children: any;
            class: string;
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
