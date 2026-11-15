import {useI18n} from '@codeimage/locale';
import {Button, DialogPanelContent, DialogPanelFooter} from '@codeui/kit';
import {Dialog} from '@kobalte/core/dialog';
import type {Accessor} from 'solid-js';
import {Match, Show, Switch} from 'solid-js';
import type {AppLocaleEntries} from '../../../i18n';
import {useExportShortcuts} from '../controls/shortcuts';
import type {Exporter} from './export';
import * as styles from './export.css';
import {PanelExport} from './export-variants/panel';
import {exportVariant} from './export-variants/picker';
import {SheetExport} from './export-variants/sheet';
import {ToolbarExport} from './export-variants/toolbar';

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
 * every image action passes through. The prototype picker chooses how the
 * one-off export is offered.
 */
export function ExportControl(props: ExportControlProps) {
  const [t] = useI18n<AppLocaleEntries>();
  const exporter = () => props.exporter;
  const redactedLabel = () => t('editor.redacted');
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
      <Switch>
        <Match when={exportVariant() === 1}>
          <PanelExport {...props} />
        </Match>
        <Match when={exportVariant() === 2}>
          <ToolbarExport {...props} />
        </Match>
        <Match when={exportVariant() === 3}>
          <SheetExport {...props} />
        </Match>
      </Switch>
      <Dialog open={exporter().confirming()} onOpenChange={closeConfirmation}>
        <Dialog.Portal>
          <Dialog.Overlay class={styles.backdrop} />
          <div class={styles.confirmation}>
            <Dialog.Content
              class={styles.confirmationPanel}
              onCloseAutoFocus={restoreFocus}
            >
              <Dialog.Title>{t('export.title')}</Dialog.Title>
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
                    <p class={styles.hint}>{t('secrets.destructiveHint')}</p>
                    <Button size="sm" theme="secondary" onClick={redactSecrets}>
                      {t('secrets.redactAll')}
                    </Button>
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
