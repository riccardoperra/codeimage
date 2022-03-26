import {
  createMemo,
  createSignal,
  For,
  JSXElement,
  onCleanup,
  onMount,
} from 'solid-js';
import {Box} from '../ui/Box/Box';
import * as styles from './terminal.css';
import {appEnvironment} from '../../core/configuration';
import {TabIcon} from './TabIcon';
import {highlight as _highlight} from '../../core/directives/highlight';
import '../ui/Combobox/InlineCombobox';
import {InlineCombobox} from '../ui/Combobox/InlineCombobox';
import createResizeObserver from '@solid-primitives/resize-observer';
import {useFloating} from '../../core/floating-ui/floating-ui';
import {offset} from '@floating-ui/dom';

interface TabNameProps {
  readonly: boolean;
  value?: string;
  onValueChange?: (value: string) => void;
}

const highlight = _highlight;

export function TabName(props: TabNameProps): JSXElement {
  let ref: InlineCombobox;
  const hasDot = /^[a-zA-Z0-9]{2,}\./;
  const [width, setWidth] = createSignal(0);
  const showHint = createMemo(() => {
    return hasDot.test(props.value ?? '');
  });

  function onChange(value: string): void {
    if (props.onValueChange) {
      props.onValueChange(value);
    }
  }

  const icons = appEnvironment.languages.flatMap(language => language.icons);

  const extension = createMemo(() => {
    if (!props.value) return '';
    const extension = /\.[0-9a-z]+$/i.exec(props.value);
    return (extension ? extension[0] : '').replace('.', '');
  });

  const matchedIcons = createMemo(() => {
    if (!props.value) {
      return icons;
    }

    const currentExtension = extension();

    return (
      icons
        .filter(icon => icon.extension.includes(currentExtension))
        // TODO: remove this when icons will not be duplicated in configuration.
        .filter(
          (icon, index, self) =>
            index === self.findIndex(i => i.extension === icon.extension),
        )
    );
  });

  const getFormattedValue = (value: string) => {
    const sanitizedValue = props.value || '';
    return sanitizedValue.replace(/\.([0-9a-z]?)+$/i, `.${value}`);
  };

  const floating = useFloating({
    strategy: 'absolute',
    placement: 'bottom-start',
    middleware: [offset(10)],
  });

  onMount(() => {
    floating.setReference(ref);

    const observe = createResizeObserver({
      onResize: resize => setWidth(resize.width),
    });

    observe(ref);

    const onSelectedItem = (evt: CustomEvent<{value: string}>) =>
      setTimeout(() => onChange(evt.detail.value));

    ref.addEventListener('selectedItem', onSelectedItem);

    onCleanup(() => {
      ref.removeEventListener('selectedItem', onSelectedItem);
    });
  });

  return (
    <cmg-inline-combobox
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      ref={ref!}
      onInput={event => onChange((event.target as HTMLInputElement).value)}
      name="tabName"
      value={props.value}
      placeholder={'Untitled'}
      prop:valueMapper={getFormattedValue}
      prop:autocomplete={'none'}
    >
      <Box
        ref={floating.setFloating}
        class={styles.tabHint}
        display={showHint() ? 'block' : 'none'}
        style={{
          position: floating.strategy,
          left: `${(floating.x ?? 0) + width() - 10}px`,
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
                  <div use:highlight={extension()}>{icon.extension}</div>
                </Box>
              </cmg-combobox-option>
            );
          }}
        </For>
      </Box>
    </cmg-inline-combobox>
  );
}
