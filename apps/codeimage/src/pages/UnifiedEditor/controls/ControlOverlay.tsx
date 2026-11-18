import {useI18n} from '@codeimage/locale';
import {getFrameState} from '@codeimage/store/editor/frame';
import {displayHandle} from '@codeimage/store/frame/signature';
import {icons} from '@ui/kit-icons';
import {Button} from '@ui/legacy-controls';
import {Dialog, Content as DialogContent} from '@ui/Dialog/parts';
import {
  createSignal,
  For,
  Show,
  onCleanup,
  createTrackedEffect,
} from 'solid-js';
import {Dynamic} from '@solidjs/web';
import {
  PanelRow,
  TwoColumnPanelRow,
} from '../../../components/PropertyEditor/PanelRow';
import type {AppLocaleEntries} from '../../../i18n';
import {commandMenu} from '../command-menu/state';
import {ColorPickerPopover} from '../localized/ColorPicker';
import type {ControlId, EditorControlsModel, Control} from '../model';
import {AmbientSwatch} from './AmbientSwatch';
import {ControlRow} from './ControlRow';
import {placeControlOverlay} from './overlay-placement';
import * as styles from './overlay.css';
import {ChoiceList, FontEditor} from './PickerContent';
import {PickerValue} from './PickerValue';
import {WindowStyleTiles} from './WindowStyleTiles';

const [target, setTarget] = createSignal<ControlId | 'signature'>();
let opener: HTMLElement | undefined;
export const controlOverlay = {
  open: (id: ControlId | 'signature') => {
    const active = document.activeElement;
    opener =
      active instanceof HTMLElement &&
      active !== document.body &&
      !active.closest('[data-command-menu]')
        ? active
        : commandMenu.opener();
    setTarget(id);
  },
  close: () => {
    if (!target()) return;
    setTarget(undefined);
  },
};

export function SignatureRow() {
  const [t] = useI18n<AppLocaleEntries>();
  const signature = () => getFrameState().store.signature;
  const open = () => controlOverlay.open('signature');
  return (
    <div data-control="signature" class={styles.row}>
      <PanelRow label={t('signature.title')} for="signature-options">
        <TwoColumnPanelRow>
          <Button
            id="signature-options"
            class={styles.trigger}
            size="sm"
            theme="secondary"
            variant="ghost"
            aria-haspopup="dialog"
            aria-expanded={target() === 'signature'}
            aria-controls="editor-control-overlay"
            onClick={open}
          >
            <Show when={signature()} fallback={t('signature.off')}>
              {value => displayHandle(value())}
            </Show>
            <span aria-hidden="true">⌄</span>
          </Button>
        </TwoColumnPanelRow>
      </PanelRow>
    </div>
  );
}

export function PickerField(props: {control: Control; id: string}) {
  const open = () => controlOverlay.open(props.control.id);
  return (
    <Button
      id={props.id}
      class={styles.trigger}
      size="sm"
      theme="secondary"
      variant="ghost"
      aria-haspopup="dialog"
      aria-expanded={target() === props.control.id}
      aria-controls="editor-control-overlay"
      onClick={open}
    >
      <PickerValue control={props.control} />
      <span aria-hidden="true">⌄</span>
    </Button>
  );
}

/** One bounded editor for controls that need more room than a row. */
export function ControlOverlay(props: {model: EditorControlsModel}) {
  const [t] = useI18n<AppLocaleEntries>();
  const [panel, setPanel] = createSignal<HTMLDivElement>();
  const [body, setBody] = createSignal<HTMLDivElement>();
  onCleanup(controlOverlay.close);
  const control = () => {
    const id = target();
    return id && id !== 'signature' ? props.model.control(id) : undefined;
  };
  const signature = () =>
    props.model.sections.find(section => section.id === 'signature');
  const title = () =>
    target() === 'signature' ? signature()?.label() : control()?.label();
  createTrackedEffect(() => {
    const element = body();
    if (!element || !target()) return;
    const value = control();
    if (value?.kind !== 'background') return;
    value.value();
    const enhance = () => {
      element
        .querySelector('input')
        ?.setAttribute('aria-label', t('editor.colorOrGradient'));
      for (const item of element.querySelectorAll<HTMLElement>('div[title]')) {
        item.setAttribute('role', 'button');
        item.tabIndex = 0;
        item.setAttribute(
          'aria-label',
          t('editor.backgroundFill', {value: item.title}),
        );
        item.setAttribute('aria-pressed', String(item.title === value.value()));
      }
    };
    const observer = new MutationObserver(enhance);
    observer.observe(element, {childList: true, subtree: true});
    enhance();
    return () => observer.disconnect();
  });
  createTrackedEffect(() => {
    const active = target();
    const element = panel();
    if (active && element) return placeControlOverlay(element, opener, active);
  });
  const chooseFill = (event: KeyboardEvent) => {
    if (
      (event.key === 'Enter' || event.key === ' ') &&
      event.target instanceof HTMLElement &&
      event.target.matches('div[title][role="button"]')
    ) {
      event.preventDefault();
      event.target.click();
    }
  };
  const closeOnEscape = (event: KeyboardEvent) => {
    if (event.key !== 'Escape') return;
    event.stopPropagation();
    controlOverlay.close();
  };
  const changeOpen = (open: boolean) => {
    if (!open) controlOverlay.close();
  };

  const restoreFocus = (event: Event) => {
    event.preventDefault();
    const from = opener;
    // A click outside can open something that takes focus, such as a coachmark.
    requestAnimationFrame(() => {
      if (document.activeElement !== document.body) return;
      const fallback = document.querySelector<HTMLElement>(
        '[data-settings-trigger], header button',
      );
      const element =
        from &&
        from !== document.body &&
        from.isConnected &&
        from.getClientRects().length
          ? from
          : fallback;
      element?.focus();
    });
  };
  return (
    <Dialog open={!!target()} onOpenChange={changeOpen} modal={false}>
      <Dialog.Portal>
        <DialogContent
          id="editor-control-overlay"
          class={styles.content}
          ref={setPanel}
          data-control-overlay={target()}
          onCloseAutoFocus={restoreFocus}
          onKeyDown={closeOnEscape}
        >
          <div class={styles.header}>
            <Dialog.Title class={styles.title}>{title()}</Dialog.Title>
            <Dialog.CloseButton size="sm" ghost aria-label={t('common.close')}>
              <icons.CloseIcon />
            </Dialog.CloseButton>
          </div>
          <div class={styles.body} ref={setBody} onKeyDown={chooseFill}>
            <Show
              when={target() === 'signature'}
              fallback={
                <Show when={control()} keyed>
                  {control =>
                    control.id === 'font.family' ? (
                      <FontEditor
                        model={props.model}
                        close={controlOverlay.close}
                      />
                    ) : control.id === 'frame.aspectRatio' &&
                      control.kind === 'select' ? (
                      <ChoiceList control={control} />
                    ) : control.id === 'window.style' &&
                      control.kind === 'select' ? (
                      <WindowStyleTiles control={control} />
                    ) : control.kind === 'background' ? (
                      <>
                        <AmbientSwatch control={control} />
                        <ColorPickerPopover
                          value={control.value()}
                          onChange={control.set}
                          colors={[...control.colors]}
                          gradientColors={[...control.gradients]}
                        />
                      </>
                    ) : control.kind === 'custom' ? (
                      <Dynamic
                        component={control.Control}
                        id={`overlay-${control.id.replace('.', '-')}`}
                      />
                    ) : (
                      <ControlRow control={control} prefix="overlay" />
                    )
                  }
                </Show>
              }
            >
              <For each={signature()?.controls}>
                {control => <ControlRow control={control} prefix="overlay" />}
              </For>
            </Show>
          </div>
        </DialogContent>
      </Dialog.Portal>
    </Dialog>
  );
}
