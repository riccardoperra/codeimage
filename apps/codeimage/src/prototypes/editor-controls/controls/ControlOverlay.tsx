import {useI18n} from '@codeimage/locale';
import {getFrameState} from '@codeimage/store/editor/frame';
import {displayHandle} from '@codeimage/store/frame/signature';
import {Button} from '@codeui/kit';
import {Dialog} from '@kobalte/core/dialog';
import {createSignal, For, Show, onCleanup} from 'solid-js';
import {Dynamic} from 'solid-js/web';
import type {AppLocaleEntries} from '../../../i18n';
import {ColorPickerPopover} from '../localized/ColorPicker';
import {
  PanelRow,
  TwoColumnPanelRow,
} from '../../../components/PropertyEditor/PanelRow';
import type {ControlId, EditorControlsModel, Control} from '../model';
import {ControlRow} from './ControlRow';
import {commandMenu} from '../command-menu/state';
import {AmbientSwatch} from './AmbientSwatch';
import {WindowStyleTiles} from './WindowStyleTiles';
import {ChoiceList, FontEditor} from './PickerContent';
import * as styles from './overlay.css';

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
  const [t] = useI18n<AppLocaleEntries>();
  const open = () => controlOverlay.open(props.control.id);
  const value = () => {
    const control = props.control;
    if (control.kind === 'select' || control.kind === 'segmented')
      return control.options().find(option => option.key === control.value())
        ?.label;
    return t('editor.choose');
  };
  return (
    <Button
      id={props.id}
      class={styles.trigger}
      size="sm"
      theme="secondary"
      variant="ghost"
      aria-haspopup="dialog"
      onClick={open}
    >
      {value()}
      <span aria-hidden="true">⌄</span>
    </Button>
  );
}

/** One bounded editor for controls that need more room than a row. */
export function ControlOverlay(props: {model: EditorControlsModel}) {
  const [t] = useI18n<AppLocaleEntries>();
  onCleanup(controlOverlay.close);
  const control = () => {
    const id = target();
    return id && id !== 'signature' ? props.model.control(id) : undefined;
  };
  const signature = () =>
    props.model.sections.find(section => section.id === 'signature');
  const title = () =>
    target() === 'signature' ? signature()?.label() : control()?.label();
  const changeOpen = (open: boolean) => {
    if (!open) controlOverlay.close();
  };

  const restoreFocus = (event: Event) => {
    event.preventDefault();
    queueMicrotask(() => {
      const fallback = document.querySelector<HTMLElement>(
        '[data-settings-trigger], header button',
      );
      const element =
        opener &&
        opener !== document.body &&
        opener.isConnected &&
        opener.getClientRects().length
          ? opener
          : fallback;
      element?.focus();
    });
  };
  return (
    <Dialog open={!!target()} onOpenChange={changeOpen}>
      <Dialog.Portal>
        <Dialog.Overlay class={styles.backdrop} />
        <Dialog.Content
          class={styles.content}
          role="dialog"
          aria-label={title()}
          data-control-overlay={target()}
          onCloseAutoFocus={restoreFocus}
        >
          <div class={styles.header}>
            <Dialog.Title class={styles.title}>{title()}</Dialog.Title>
            <Dialog.CloseButton
              as={Button}
              size="sm"
              theme="secondary"
              variant="ghost"
              aria-label={t('common.close')}
            >
              ×
            </Dialog.CloseButton>
          </div>
          <div class={styles.body}>
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
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  );
}
