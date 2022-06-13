import {SUPPORTED_LANGUAGES} from '@codeimage/config';
import {Box, useFloating} from '@codeimage/ui';
import {highlight as _highlight} from '@core/directives/highlight';
import {createResizeObserver} from '@solid-primitives/resize-observer';
import {InlineCombobox} from '@ui/Combobox';
import {
  createEffect,
  createMemo,
  createResource,
  createSignal,
  For,
  JSXElement,
  Show,
} from 'solid-js';
import {TabIcon} from '../TabIcon/TabIcon';
import * as styles from './TabName.css';

interface TabNameProps {
  readonly: boolean;
  value?: string;
  onValueChange?: (value: string) => void;
}

const highlight = _highlight;

let wcAlreadyLoaded = false;

export function TabName(props: TabNameProps): JSXElement {
  const [wcLoaded] = createResource(() =>
    !wcAlreadyLoaded
      ? import('@ui/Combobox').then(() => true).catch(() => false)
      : true,
  );

  let ref: InlineCombobox;
  const hasDot = /^[a-zA-Z0-9$_-]{2,}\./;
  const [width, setWidth] = createSignal(0);
  const showHint = createMemo(() => hasDot.test(props.value ?? ''));

  function onChange(value: string): void {
    if (props.onValueChange && value !== props.value) {
      props.onValueChange(value);
    }
  }

  const icons = SUPPORTED_LANGUAGES.flatMap(language => language.icons);

  const extension = createMemo(() => {
    if (!props.value) return '';
    const extension = /\.[0-9a-z.]+$/i.exec(props.value);
    return (extension ? extension[0] : '').replace('.', '');
  });

  const matchedIcons = createMemo(() => {
    const uniqueIcons = icons.filter(
      (icon, index, self) =>
        index === self.findIndex(i => i.extension === icon.extension),
    );

    if (!props.value) {
      return uniqueIcons;
    }

    const currentExtension = extension();

    if (!currentExtension && props.value.endsWith('.')) {
      return uniqueIcons;
    }

    if (!currentExtension) return [];

    return uniqueIcons.filter(icon =>
      icon.extension.includes(currentExtension),
    );
  });

  const getFormattedValue = (value: string) => {
    const sanitizedValue = props.value || '';
    return sanitizedValue.replace(/\.([0-9a-z.]?)+$/i, `.${value}`);
  };

  const floating = useFloating({
    strategy: 'absolute',
    placement: 'bottom-start',
    runAutoUpdate: true,
  });

  createEffect(() => {
    if (wcLoaded()) {
      createResizeObserver(
        () => ref,
        ({width}) => setWidth(width),
      );

      if (!props.readonly && wcAlreadyLoaded) {
        // Cannot use queueScheduler
        requestAnimationFrame(() => ref?.focus());
      }

      if (!wcAlreadyLoaded) {
        wcAlreadyLoaded = true;
      }
    }
  });

  return (
    <Show when={wcLoaded()}>
      <cmg-inline-combobox
        ref={el => {
          ref = el;
          floating.setReference(el);
        }}
        name="tabName"
        value={props.value}
        placeholder={'Untitled'}
        onInput={event => onChange((event.target as HTMLInputElement).value)}
        on:selectedItemChange={event =>
          setTimeout(() => onChange(event.detail.value))
        }
        on:inputTextChange={event => onChange(event.detail.value)}
        prop:valueMapper={getFormattedValue}
        prop:_noTypeAhead={true}
        prop:autocomplete={'none'}
      >
        <Box
          ref={floating.setFloating}
          class={styles.tabHint}
          display={showHint() ? 'block' : 'none'}
          style={{
            position: floating.strategy,
            top: `${floating.y ?? 0}px`,
            left: `${(floating.x ?? 0) + width() - 20}px`,
          }}
        >
          <For each={matchedIcons()}>
            {icon => {
              const value = icon.extension.replace('.', '');
              return (
                <cmg-combobox-option
                  onClick={() => onChange(getFormattedValue(value))}
                  class={styles.tabHintDropdownOption}
                  prop:choiceValue={value}
                >
                  <Box class={styles.tabHintDropdownItemContent}>
                    <TabIcon delay={0} content={icon.content} />
                    <div use:highlight={extension()} class={styles.tabText}>
                      {icon.extension}
                    </div>
                  </Box>
                </cmg-combobox-option>
              );
            }}
          </For>
        </Box>
      </cmg-inline-combobox>
    </Show>
  );
}
