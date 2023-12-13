import {LanguageIconDefinition, SUPPORTED_LANGUAGES} from '@codeimage/config';
import {highlight as _highlight} from '@core/directives/highlight';
import {Combobox} from '@kobalte/core';
import {createResizeObserver} from '@solid-primitives/resize-observer';
import {createEffect, createMemo, createSignal, JSXElement} from 'solid-js';
import {TabIcon} from '../TabIcon/TabIcon';
import * as styles from './TabName.css';

interface TabNameProps {
  readonly: boolean;
  value?: string;
  onValueChange?: (value: string) => void;
}

const highlight = _highlight;

const icons = SUPPORTED_LANGUAGES.flatMap(language => language.icons);

const uniqueIcons = icons.filter(
  (icon, index, self) =>
    index === self.findIndex(i => i.extension === icon.extension),
);

export default function TabName(props: TabNameProps): JSXElement {
  let hiddenTextEl!: HTMLInputElement;
  let portal!: HTMLDivElement;
  const [width, setWidth] = createSignal(0);
  const gap = 8;
  const placeholder = 'Untitled';

  const computedWidth = () => width() + gap;

  const inputStyle = () => ({
    width: `${computedWidth()}px`,
  });

  const onChange = (value: string): void => {
    if (props.onValueChange) {
      props.onValueChange(value);
    }
  };

  const onSelectItem = (item: LanguageIconDefinition) => {
    const sanitizedExtension = item.extension.replace('.', '');
    const value = getFormattedValue(sanitizedExtension);
    onChange(value);
  };

  const getExtensionByInputValue = (inputValue: string | undefined | null) => {
    if (!inputValue) return '';
    const extension = /\.[0-9a-z.]+$/i.exec(inputValue);
    return (extension ? extension[0] : '').replace('.', '');
  };

  const extension = createMemo(() => getExtensionByInputValue(props.value));

  const isMatched = (option: LanguageIconDefinition, inputValue: string) => {
    if (!inputValue) return true;
    const currentExtension = getExtensionByInputValue(inputValue);
    if (!currentExtension && inputValue.endsWith('.')) {
      return true;
    }
    if (!currentExtension) return false;
    return option.extension.includes(currentExtension);
  };

  const getFormattedValue = (value: string) => {
    const sanitizedValue = props.value || '';
    return sanitizedValue.replace(/\.([0-9a-z.]?)+$/i, `.${value}`);
  };

  const selectedItem = createMemo(() => {
    return uniqueIcons.find(uniqueIcon => extension() == uniqueIcon.extension);
  });

  const hiddenText = () => props.value || placeholder;

  const adjustPopperPositionerStyle = () => {
    setTimeout(() => {
      const popperPositioner = portal.querySelector('[data-popper-positioner]');
      if (popperPositioner) {
        (
          popperPositioner as HTMLElement
        ).style.transition = `transform 150ms ease-in-out`;
      }
    }, 200);
  };

  createEffect(() => {
    setWidth(hiddenTextEl.clientWidth);
    createResizeObserver(
      () => hiddenTextEl,
      ({width}) => setWidth(width),
      {box: 'content-box'},
    );
  });

  return (
    <Combobox.Root
      value={selectedItem()}
      onChange={onSelectItem}
      optionLabel={'name'}
      optionTextValue={'name'}
      optionValue={'extension'}
      disallowEmptySelection={true}
      placement={'bottom-start'}
      gutter={-2}
      shift={width() - 10}
      onOpenChange={isOpen => {
        if (isOpen) {
          adjustPopperPositionerStyle();
        }
      }}
      itemComponent={props => {
        return (
          <Combobox.Item
            item={props.item}
            class={styles.tabHintDropdownItemContent}
          >
            <Combobox.ItemLabel class={styles.tabHintDropdownItemLabel}>
              <TabIcon delay={0} content={props.item.rawValue.content} />
              <div use:highlight={extension()} class={styles.tabText}>
                {props.item.rawValue.extension}
              </div>
            </Combobox.ItemLabel>
          </Combobox.Item>
        );
      }}
      placeholder={placeholder}
      options={uniqueIcons}
      triggerMode={'focus'}
      defaultFilter={isMatched}
    >
      <Combobox.Control class={styles.control} aria-label="Tab name">
        <Combobox.Input
          value={props.value}
          class={styles.input}
          style={inputStyle()}
          onInput={el => onChange(el.currentTarget.value)}
        />
        <div ref={hiddenTextEl} class={styles.inlineHiddenItem}>
          {hiddenText()}
        </div>
      </Combobox.Control>
      <Combobox.Portal ref={portal}>
        <Combobox.Content class={styles.tabHint}>
          <Combobox.Listbox class={styles.listbox} />
        </Combobox.Content>
      </Combobox.Portal>
    </Combobox.Root>
  );
}
