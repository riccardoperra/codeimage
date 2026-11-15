import {useI18n} from '@codeimage/locale';
import {getRootEditorStore} from '@codeimage/store/editor';
import {Button} from '@codeui/kit';
import {createSignal, onCleanup, onMount, Show} from 'solid-js';
import {KeyboardShortcuts} from '../../../components/KeyboardShortcuts/KeyboardShortcuts';
import {HintIcon} from '../../../components/Icons/Hint';
import type {AppLocaleEntries} from '../../../i18n';
import * as styles from './shortcut-help.css';
import {commandMenu} from '../command-menu/state';
import * as production from '../../../components/KeyboardShortcuts/KeyboardShortcuts.css';

export const shortcutHelp = {
  open: () =>
    queueMicrotask(() =>
      document
        .querySelector<HTMLButtonElement>('[data-shortcut-help] > button')
        ?.click(),
    ),
};

/** Keep the production list and hotkeys, with a viewport-sized overlay. */
export function ShortcutHelp() {
  const [t] = useI18n<AppLocaleEntries>();
  const [generation, setGeneration] = createSignal(1);
  let mount!: HTMLSpanElement;
  const [shown, setShown] = createSignal(false);
  const reset = () => {
    setShown(false);
    setGeneration(value => value + 1);
  };
  onCleanup(commandMenu.beforeOpen(reset));
  const open = () => {
    // Production keeps its visibility and headless-popover state separately.
    // A fresh instance opens reliably after Escape, outside clicks and commands.
    reset();
    setShown(true);
    mount.parentElement
      ?.querySelector<HTMLButtonElement>(':scope > button')
      ?.focus();
    queueMicrotask(() =>
      mount.querySelector<HTMLButtonElement>('button')?.click(),
    );
  };
  onMount(() => {
    const keydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && shown()) {
        event.preventDefault();
        event.stopImmediatePropagation();
        reset();
        mount.parentElement
          ?.querySelector<HTMLButtonElement>(':scope > button')
          ?.focus();
        return;
      }
      if (event.key !== '?' || event.metaKey || event.ctrlKey || event.altKey)
        return;
      if (
        getRootEditorStore().state.options.focused ||
        (event.target instanceof Element &&
          event.target.closest(
            'input, textarea, [contenteditable=true], [role=dialog]',
          ))
      )
        return;
      event.preventDefault();
      event.stopImmediatePropagation();
      if (shown()) reset();
      else open();
    };
    const outside = (event: MouseEvent) => {
      if (
        event.target instanceof Element &&
        event.target.classList.contains(production.overlay)
      )
        reset();
    };
    window.addEventListener('click', outside, true);
    onCleanup(() => window.removeEventListener('click', outside, true));
    window.addEventListener('keydown', keydown, true);
    onCleanup(() => window.removeEventListener('keydown', keydown, true));
  });
  return (
    <span class={styles.host} data-shortcut-help>
      <Button
        size="sm"
        theme="secondary"
        variant="ghost"
        aria-label={t('shortcut.buttonAction')}
        title={t('shortcut.buttonAction')}
        aria-haspopup="dialog"
        aria-expanded={shown()}
        onClick={open}
      >
        <HintIcon size="sm" />
      </Button>
      <span ref={mount} class={styles.mount}>
        <Show when={generation()} keyed>
          {_generation => <KeyboardShortcuts />}
        </Show>
      </span>
    </span>
  );
}
