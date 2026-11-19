import {useI18n} from '@codeimage/locale';
import {getRootEditorStore} from '@codeimage/store/editor';
import {icons} from '@ui/kit-icons';
import {Button} from '@ui/legacy-controls';
import {Dialog, Content as DialogContent} from '@ui/Dialog/parts';
import {placePopover} from '@ui/Popover/placement';
import type {Accessor} from 'solid-js';
import {
  createEffect,
  createSignal,
  untrack,
  For,
  Show,
  onCleanup,
  onSettled,
} from 'solid-js';
import {HintIcon} from '../../../components/Icons/Hint';
import {isKeyOwnedByFocus} from '../../../hooks/use-hotkey';
import type {AppLocaleEntries} from '../../../i18n';
import {commandMenu} from '../command-menu/state';
import * as styles from './shortcut-help.css';
import {bindEditorShortcuts, shortcutHelpKey, shortcuts} from './shortcuts';

const [open, setOpen] = createSignal(false);
export const shortcutHelp = {open: () => setOpen(true)};

export function ShortcutHelp(props: {
  editable: boolean;
  canvas?: Accessor<HTMLElement | undefined>;
}) {
  const [t] = useI18n<AppLocaleEntries>();
  const [trigger, setTrigger] = createSignal<HTMLButtonElement>();
  const [panel, setPanel] = createSignal<HTMLDivElement>();
  const [clear, setClear] = createSignal(true);
  let opener: HTMLElement | undefined;
  const close = () => setOpen(false);
  const show = () => setOpen(true);
  const restoreFocus = (event: Event) => {
    event.preventDefault();
    if (clear()) trigger()?.focus();
    else
      (opener?.isConnected
        ? opener
        : document.querySelector<HTMLElement>('[data-settings-trigger]')
      )?.focus();
  };
  bindEditorShortcuts(() => props.editable);
  onCleanup(commandMenu.beforeOpen(close));
  onCleanup(close);
  createEffect(
    () => [props.canvas?.(), trigger()] as const,
    ([canvas, anchor]) => {
      if (!canvas || !anchor) return;
      const measure = () => {
        const frame = canvas.querySelector('[data-fit-scale]');
        if (!frame) return;
        const a = anchor.getBoundingClientRect();
        const b = frame.getBoundingClientRect();
        const c = canvas.getBoundingClientRect();
        setClear(
          a.right <= c.right - 12 &&
            a.bottom <= c.bottom - 12 &&
            !(
              a.left < b.right + 8 &&
              a.right > b.left - 8 &&
              a.top < b.bottom + 8 &&
              a.bottom > b.top - 8
            ),
        );
      };
      const observer = new ResizeObserver(measure);
      observer.observe(canvas);
      const frame = canvas.querySelector('[data-fit-scale]');
      if (frame) observer.observe(frame);
      observer.observe(anchor);
      measure();
      return () => observer.disconnect();
    },
  );
  createEffect(
    () => [open(), props.canvas?.(), trigger(), panel()] as const,
    ([showing, canvas, anchor, element]) => {
      if (!showing || !canvas || !anchor || !element) return;
      let positioned = false;
      return placePopover(
        anchor,
        element,
        {placement: 'bottom-start', gutter: 8, overflowPadding: 12},
        () => {
          if (positioned) return;
          positioned = true;
          element.focus({preventScroll: true});
        },
      );
    },
  );
  onSettled(() => {
    const keydown = (event: KeyboardEvent) => {
      if (
        !untrack(() => props.editable) ||
        event.key !== shortcutHelpKey ||
        event.metaKey ||
        event.ctrlKey ||
        event.altKey ||
        getRootEditorStore().state.options.focused ||
        isKeyOwnedByFocus(event)
      )
        return;
      event.preventDefault();
      opener =
        document.activeElement instanceof HTMLElement
          ? document.activeElement
          : undefined;
      setOpen(value => !value);
    };
    window.addEventListener('keydown', keydown);
    return () => window.removeEventListener('keydown', keydown);
  });
  return (
    <span
      class={`${styles.host} ${props.canvas ? styles.canvasEntry : ''}`}
      data-shortcut-help
    >
      <Button
        ref={element => setTrigger(element)}
        style={{visibility: clear() ? undefined : 'hidden'}}
        size="sm"
        theme="secondary"
        variant="ghost"
        aria-label={t('shortcut.buttonAction')}
        title={t('shortcut.buttonAction')}
        aria-haspopup="dialog"
        aria-expanded={open()}
        onClick={show}
      >
        <Show when={props.canvas} fallback={<HintIcon size="sm" />}>
          {t('editor.shortcuts')}
          <kbd class={styles.key}>{shortcutHelpKey}</kbd>
        </Show>
      </Button>
      <Dialog open={open()} onOpenChange={setOpen} modal={!props.canvas}>
        <Dialog.Portal>
          <Show when={!props.canvas}>
            <Dialog.Overlay class={styles.backdrop} />
          </Show>
          <DialogContent
            class={props.canvas ? styles.anchoredContent : styles.content}
            data-shortcut-overlay
            ref={element => setPanel(element)}
            onOpenAutoFocus={event => {
              if (props.canvas) event.preventDefault();
            }}
            onCloseAutoFocus={restoreFocus}
          >
            <div class={styles.header}>
              <Dialog.Title>{t('shortcut.buttonAction')}</Dialog.Title>
              <Dialog.CloseButton
                size="sm"
                ghost
                aria-label={t('common.close')}
              >
                <icons.CloseIcon />
              </Dialog.CloseButton>
            </div>
            <dl class={styles.list}>
              <For each={shortcuts}>
                {shortcut => (
                  <>
                    <dt class={styles.keyLabel}>{t(shortcut.label)}</dt>
                    <dd class={styles.keys}>
                      <For each={shortcut.key}>
                        {key => <kbd class={styles.key}>{key}</kbd>}
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
