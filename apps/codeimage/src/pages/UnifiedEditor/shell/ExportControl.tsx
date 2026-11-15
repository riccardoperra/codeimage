import {useI18n} from '@codeimage/locale';
import {Button, DialogPanelContent, DialogPanelFooter} from '@codeui/kit';
import {Dialog} from '@kobalte/core/dialog';
import type {Accessor} from 'solid-js';
import {getEditorStore} from '@codeimage/store/editor';
import {Show} from 'solid-js';
import type {AppLocaleEntries} from '../../../i18n';
import {useExportShortcuts} from '../controls/shortcuts';
import type {Exporter} from './export';
import {AnimationExportDialog} from './export-animation-dialog';
import * as styles from './export.css';
import {VideoExport} from './export-styles/video';
import {PanelExport} from './export-styles/panel';
import {SheetExport} from './export-styles/sheet';
import {preferences} from './preferences';

export interface ExportControlProps {
  exporter: Exporter;
  /** The hidden copy of the frame that export captures. */
  exportRef: Accessor<HTMLElement | undefined>;
  size: 'sm' | 'xs';
  /** A phone, where the layout places Export beside the canvas. */
  compact: boolean;
}

/**
 * Export, its keyboard shortcuts and the review of visible secrets that
 * every image action passes through. The export style preference chooses
 * how the one-off export is offered.
 */
export function ExportControl(props: ExportControlProps) {
  const [t] = useI18n<AppLocaleEntries>();
  const exporter = () => props.exporter;
  const {animation} = getEditorStore();
  const imageMode = () => {
    exporter().animation.close();
    animation.actions.setOpen(false);
    requestAnimationFrame(() =>
      document.querySelector<HTMLButtonElement>('[data-export-menu]')?.click(),
    );
  };
  const redactedLabel = () => t('editor.redacted');
  const startAnimation = () => exporter().startAnimation();
  const redactSecrets = () => exporter().redactSecrets();
  const closeConfirmation = (open: boolean) => {
    if (!open) exporter().cancel();
  };
  const cancel = () => exporter().cancel();
  const confirm = () => exporter().confirm();

  const restoreFocus = (event: Event) => {
    event.preventDefault();
    requestAnimationFrame(() => {
      if (!exporter().confirming())
        document.querySelector<HTMLElement>('[data-export-image]')?.focus();
    });
  };
  useExportShortcuts(exporter);

  return (
    <>
      <Show
        when={animation.open()}
        fallback={
          <>
            <Show
              when={preferences.exportStyle() === 'sheet'}
              fallback={<PanelExport {...props} />}
            >
              <SheetExport {...props} />
            </Show>
            <AnimationExportDialog
              exporter={exporter().animation}
              onStart={startAnimation}
            />
          </>
        }
      >
        <VideoExport {...props} onImage={imageMode} />
      </Show>
      <Dialog open={exporter().confirming()} onOpenChange={closeConfirmation}>
        <Dialog.Portal>
          <Dialog.Overlay class={styles.backdrop} />
          <div class={styles.confirmation}>
            <Dialog.Content
              class={styles.confirmationPanel}
              onCloseAutoFocus={restoreFocus}
            >
              <Dialog.Title>
                {exporter().confirmingAnimation()
                  ? t('animation.export.title')
                  : t('export.title')}
              </Dialog.Title>
              <DialogPanelContent>
                <div class={styles.warning}>
                  <Show when={exporter().secrets() > 0}>
                    <div role="status">
                      {exporter().secrets() === 1
                        ? t('secrets.visibleOne')
                        : t('secrets.visible', {
                            count: String(exporter().secrets()),
                          })}
                    </div>
                    <Show when={exporter().canRedact()}>
                      <p class={styles.hint}>{t('secrets.destructiveHint')}</p>
                      <Button
                        size="sm"
                        theme="secondary"
                        onClick={redactSecrets}
                      >
                        {t('secrets.redactAll')}
                      </Button>
                    </Show>
                  </Show>
                  <Show when={exporter().secrets() === 0}>
                    <div role="status">{redactedLabel()}</div>
                  </Show>
                </div>
              </DialogPanelContent>
              <DialogPanelFooter>
                <div class={styles.confirmActions}>
                  <Button size="sm" theme="secondary" onClick={cancel}>
                    {t('common.close')}
                  </Button>
                  <Button size="sm" theme="primary" onClick={confirm}>
                    {exporter().secrets() > 0
                      ? t('secrets.exportAnyway')
                      : t('common.confirm')}
                  </Button>
                </div>
              </DialogPanelFooter>
            </Dialog.Content>
          </div>
        </Dialog.Portal>
      </Dialog>
    </>
  );
}
