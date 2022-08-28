import {LionCombobox} from '@lion/combobox';
import {css, html, PropertyValues} from '@lion/core';
import {LionOption} from '@lion/listbox';
import {map, Subject, takeUntil} from 'rxjs';
import {mutationObserverFactory$} from '@core/operators/create-mutation-observer';
import {resizeObserverFactory$} from '@core/operators/create-resize-observer';

interface InlineComboboxEventMap extends HTMLElementEventMap {
  selectedItem: CustomEvent<{value: string}>;
}

// @ts-expect-error Implementation must be extended
export class InlineCombobox extends LionCombobox {
  valueMapper?: (value: string) => string;
  placeholder: string | null | undefined;
  value: string | null | undefined;

  readonly destroy$ = new Subject<void>();

  static get properties() {
    return {
      ...super.properties,
      placeholder: {type: String},
      value: {type: String},
      _noTypeAhead: {
        type: Boolean,
      },
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
        appearance: none;
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

      ::slotted(.form-control) {
        background-color: transparent;
        color: inherit;
        appearance: none;
        outline: none;
      }

      ::slotted(.form-control) {
        padding: 0;
        margin: 0;
        outline: none !important;
      }
    `,
  ];

  protected firstUpdated(_changedProperties: PropertyValues) {
    super.firstUpdated(_changedProperties);

    this._inputNode.style.setProperty('appearance', 'none');
    this._inputNode.style.setProperty('-webkit-appearance', 'none');

    if (this.hiddenValueNode) {
      resizeObserverFactory$(this.hiddenValueNode, {box: 'content-box'})
        .pipe(
          takeUntil(this.destroy$),
          map(entries => entries[0].contentRect.width),
        )
        .subscribe(width => this.recalculateWidth(width));

      if (!!this._listboxNode && !!this._listboxNode.firstChild) {
        mutationObserverFactory$(this._listboxNode.firstChild as HTMLElement, {
          childList: true,
        })
          .pipe(
            map(() => this.formElements),
            map(() => (this.activeIndex === -1 ? 0 : this.activeIndex)),
            takeUntil(this.destroy$),
          )
          .subscribe(activeIndex => (this.activeIndex = activeIndex));
      }
    }
  }

  connectedCallback() {
    super.connectedCallback();

    this.config = {
      placementMode: 'global',
      isTooltip: false,
      isBlocking: false,
    };
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
    this.destroy$.next();
    this.destroy$.complete();
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
      this.style.setProperty('width', `${width + 8}px`);
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
    if (
      this.opened &&
      (key === 'Enter' || key === 'Tab') &&
      this.activeIndex !== -1
    ) {
      const value = this._getTextboxValueFromOption(
        this.formElements[this.activeIndex],
      );
      this.dispatchEvent(
        new CustomEvent('selectedItemChange', {detail: {value}}),
      );
    }

    if (this.opened && this.formElements.length > 0) {
      super._listboxOnKeyDown(ev);
    }
  }

  protected override __requestShowOverlay(ev: KeyboardEvent) {
    const lastKey = ev && ev.key;
    this.opened =
      !!this.formElements.length &&
      this._showOverlayCondition({
        lastKey,
        currentValue: this._inputNode.value,
      });
  }
}

export class ComboboxOption extends LionOption {
  protected createRenderRoot(): Element | ShadowRoot {
    return this;
  }
}
