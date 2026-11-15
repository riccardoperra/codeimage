import {useI18n} from '@codeimage/locale';
import {getRootEditorStore} from '@codeimage/store/editor';
import {Button, IconButton, icons} from '@codeui/kit';
import {Dialog, Content as DialogContent} from '@kobalte/core/dialog';
import {createSignal, For, onCleanup, onMount} from 'solid-js';
import {HintIcon} from '../../../components/Icons/Hint';
import * as production from '../../../components/KeyboardShortcuts/KeyboardShortcuts.css';
import type {AppLocaleEntries} from '../../../i18n';
import {commandMenu} from '../command-menu/state';
import * as styles from './shortcut-help.css';
import {bindEditorShortcuts, shortcuts} from './shortcuts';

const [open, setOpen] = createSignal(false);
export const shortcutHelp = {open: () => setOpen(true)};

export function ShortcutHelp() {
  const [t] = useI18n<AppLocaleEntries>();
  let trigger: HTMLButtonElement | undefined;
  const close = () => setOpen(false);
  const show = () => setOpen(true);
  const restoreFocus = (event: Event) => {
    event.preventDefault();
    trigger?.focus();
  };
  bindEditorShortcuts();
  onCleanup(commandMenu.beforeOpen(close));
  onCleanup(close);
  onMount(() => {
    const keydown = (event: KeyboardEvent) => {
      if (
        event.key !== '?' ||
        event.metaKey ||
        event.ctrlKey ||
        event.altKey ||
        getRootEditorStore().state.options.focused ||
        (event.target instanceof Element &&
          event.target.closest(
            'input, textarea, [contenteditable=true], [role=dialog], [role=alertdialog]',
          ))
      )
        return;
      event.preventDefault();
      setOpen(value => !value);
    };
    window.addEventListener('keydown', keydown);
    onCleanup(() => window.removeEventListener('keydown', keydown));
  });
  return (
    <span class={styles.host} data-shortcut-help>
      <Button
        ref={trigger}
        size="sm"
        theme="secondary"
        variant="ghost"
        aria-label={t('shortcut.buttonAction')}
        title={t('shortcut.buttonAction')}
        aria-haspopup="dialog"
        aria-expanded={open()}
        onClick={show}
      >
        <HintIcon size="sm" />
      </Button>
      <Dialog open={open()} onOpenChange={setOpen}>
        <Dialog.Portal>
          <Dialog.Overlay class={styles.backdrop} />
          <DialogContent class={styles.content} onCloseAutoFocus={restoreFocus}>
            <div class={styles.header}>
              <Dialog.Title>{t('shortcut.buttonAction')}</Dialog.Title>
              <Dialog.CloseButton
                as={IconButton}
                size="sm"
                theme="secondary"
                variant="ghost"
                aria-label={t('common.close')}
              >
                <icons.CloseIcon />
              </Dialog.CloseButton>
            </div>
            <dl class={styles.list}>
              <For each={shortcuts}>
                {shortcut => (
                  <>
                    <dt class={production.keyLabel}>{t(shortcut.label)}</dt>
                    <dd class={styles.keys}>
                      <For each={shortcut.key}>
                        {key => <kbd class={production.key}>{key}</kbd>}
                      </For>
                    </dd>
                  </>
                )}
              </For>
            </dl>
          </DialogContent>
        </Dialog.Portal>
      </Dialog>
    </span>
  );
}
