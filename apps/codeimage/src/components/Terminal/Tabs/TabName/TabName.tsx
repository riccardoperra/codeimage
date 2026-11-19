import type {LanguageIconDefinition} from '@codeimage/config';
import {SUPPORTED_LANGUAGES} from '@codeimage/config';
import {useI18n} from '@codeimage/locale';
import {
  autoUpdate,
  computePosition,
  flip,
  offset,
  shift,
} from '@floating-ui/dom';
import {makeResizeObserver} from '@solid-primitives/resize-observer';
import {Portal} from '@solidjs/web';
import {
  createEffect,
  createMemo,
  createSignal,
  createUniqueId,
  For,
  onSettled,
  Show,
  untrack,
} from 'solid-js';
import type {AppLocaleEntries} from '../../../../i18n';
import {TabIcon} from '../TabIcon/TabIcon';
import * as styles from './TabName.css';

interface TabNameProps {
  readonly: boolean;
  value?: string;
  onValueChange?: (value: string) => void;
}

const suffix = /\.[0-9a-z.]+$/i;
const editableSuffix = /\.[0-9a-z.]*$/i;
const iconsByExtension = new Map<string, LanguageIconDefinition>();
for (const icon of SUPPORTED_LANGUAGES.flatMap(language => language.icons)) {
  if (!iconsByExtension.has(icon.extension))
    iconsByExtension.set(icon.extension, icon);
}
const icons = [...iconsByExtension.values()];

function fileExtension(value: string) {
  return suffix.exec(value)?.[0].slice(1).toLowerCase() ?? '';
}

function OptionLabel(props: {extension: string; match: string}) {
  const start = () =>
    props.match ? props.extension.toLowerCase().indexOf(props.match) : -1;
  return (
    <span class={styles.tabText}>
      <Show when={start() >= 0} fallback={props.extension}>
        {props.extension.slice(0, start())}
        <span class={styles.highlightedText}>
          {props.extension.slice(start(), start() + props.match.length)}
        </span>
        {props.extension.slice(start() + props.match.length)}
      </Show>
    </span>
  );
}

function positionSuggestions([visible, reference, popup]: readonly [
  boolean,
  HTMLInputElement | undefined,
  HTMLDivElement | undefined,
]) {
  if (!visible || !reference || !popup) return;
  let enabled = true;
  const position = () => {
    void computePosition(reference, popup, {
      placement: 'bottom-end',
      strategy: 'fixed',
      middleware: [offset(-2), flip(), shift({padding: 8})],
    }).then(({x, y}) => {
      if (!enabled) return;
      popup.style.left = `${x}px`;
      popup.style.top = `${y}px`;
      popup.style.visibility = 'visible';
    });
  };
  const stop = autoUpdate(reference, popup, position);
  return () => {
    enabled = false;
    stop();
  };
}

export default function TabName(props: TabNameProps) {
  const [t] = useI18n<AppLocaleEntries>();
  const id = createUniqueId();
  const [shown, setShown] = createSignal(false);
  const [active, setActive] = createSignal(-1);
  const [width, setWidth] = createSignal(0);
  const [control, setControl] = createSignal<HTMLInputElement>();
  const [list, setList] = createSignal<HTMLDivElement>();
  const optionsByExtension = new Map<string, HTMLElement>();
  let hiddenText: HTMLSpanElement | undefined;
  const extension = createMemo(() => fileExtension(props.value ?? ''));
  const options = createMemo(() => {
    const value = props.value ?? '';
    if (!value || value.endsWith('.')) return icons;
    const match = extension();
    return match ? icons.filter(icon => icon.extension.includes(match)) : [];
  });
  const open = () => shown() && !props.readonly && options().length > 0;
  const optionId = (item: LanguageIconDefinition) => `${id}-${item.extension}`;

  onSettled(() => {
    if (!hiddenText) return;
    const {observe} = makeResizeObserver(([entry]) => {
      if (entry) setWidth(entry.contentRect.width);
    });
    observe(hiddenText);
  });

  createEffect(() => [open(), control(), list()] as const, positionSuggestions);

  createEffect(
    () => options()[active()]?.extension,
    item => {
      if (item)
        optionsByExtension.get(item)?.scrollIntoView({block: 'nearest'});
    },
  );

  function select(item: LanguageIconDefinition) {
    const value = props.value ?? '';
    const next = editableSuffix.test(value)
      ? value.replace(editableSuffix, item.extension)
      : value + item.extension;
    props.onValueChange?.(next);
    setShown(false);
    setActive(-1);
    if (next.startsWith('.'))
      onSettled(() => untrack(control)?.setSelectionRange(0, 0));
  }

  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === 'Escape' && open()) {
      event.preventDefault();
      event.stopPropagation();
      setShown(false);
      setActive(-1);
      return;
    }
    const items = options();
    if (props.readonly || !items.length) return;
    if (event.key === 'Enter' && open()) {
      const item = items[active()];
      if (!item) return;
      event.preventDefault();
      event.stopPropagation();
      select(item);
      return;
    }
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
    event.preventDefault();
    event.stopPropagation();
    if (!open()) setShown(true);
    const index = active();
    const step = event.key === 'ArrowDown' ? 1 : -1;
    setActive(
      index === -1 && step < 0
        ? items.length - 1
        : (index + step + items.length) % items.length,
    );
  }

  return (
    <div class={styles.control} aria-label={t('frame.tabName')}>
      <input
        ref={setControl}
        value={props.value ?? ''}
        readonly={props.readonly}
        placeholder={t('animation.untitledTab')}
        class={styles.input}
        style={{width: `${width() + 8}px`}}
        role="combobox"
        aria-label={t('frame.tabName')}
        aria-autocomplete="list"
        aria-expanded={open() ? 'true' : 'false'}
        aria-controls={open() ? id : undefined}
        aria-activedescendant={
          open() && options()[active()]
            ? optionId(options()[active()])
            : undefined
        }
        onInput={event => {
          props.onValueChange?.(event.currentTarget.value);
          setShown(true);
          setActive(-1);
        }}
        onFocus={() => setShown(true)}
        onBlur={() => {
          setShown(false);
          setActive(-1);
        }}
        onKeyDown={handleKeyDown}
      />
      <span
        ref={node => {
          hiddenText = node;
        }}
        class={styles.inlineHiddenItem}
      >
        {props.value || t('animation.untitledTab')}
      </span>
      <Show when={open()}>
        <Portal>
          <div
            ref={setList}
            id={id}
            role="listbox"
            aria-label={t('frame.tabName')}
            class={styles.tabHint}
            data-export-exclude="true"
          >
            <For each={options()}>
              {(option, index) => (
                <div
                  ref={node => optionsByExtension.set(option.extension, node)}
                  id={optionId(option)}
                  role="option"
                  aria-selected={active() === index() ? 'true' : 'false'}
                  class={styles.tabHintDropdownItemContent}
                  onMouseEnter={() => setActive(index())}
                  onPointerDown={event => event.preventDefault()}
                  onClick={() => select(option)}
                >
                  <TabIcon delay={0} content={option.content} />
                  <OptionLabel
                    extension={option.extension}
                    match={extension()}
                  />
                </div>
              )}
            </For>
          </div>
        </Portal>
      </Show>
    </div>
  );
}
