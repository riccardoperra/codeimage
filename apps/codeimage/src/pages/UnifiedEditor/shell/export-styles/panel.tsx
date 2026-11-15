import {useI18n} from '@codeimage/locale';
import {Button, IconButton, icons} from '@codeui/kit';
import {Popover} from '@kobalte/core/popover';
import {createSignal, For, Show} from 'solid-js';
import {DownloadIcon} from '../../../../components/Icons/Download';
import {NewDot} from '../../../../components/WhatsNew/NewDot';
import {getWhatsNew} from '../../../../state/whats-new';
import type {AppLocaleEntries} from '../../../../i18n';
import type {ExportAction} from '../export-actions';
import {createExportActions, ExportActionContent} from '../export-actions';
import type {ExportChoice} from '../export-formats';
import {
  exportSummary,
  sameExportChoice,
  saveExportChoice,
  savedExportChoice,
} from '../export-formats';
import * as shared from '../export.css';
import type {ExportControlProps} from '../ExportControl';
import {CheckIcon} from '../icons';
import {settings} from '../settings-state';
import {FormatChoice, QualityChoice, ScaleChoice} from './choice-fields';
import * as fields from './choice-fields.css';
import * as styles from './panel.css';

/**
 * Variant 1. The button exports at once with the saved settings. The arrow
 * opens a panel for this export only: it starts from the saved settings
 * each time, and "Save as default" keeps the choice for every export.
 */
export function PanelExport(props: ExportControlProps) {
  const [t] = useI18n<AppLocaleEntries>();
  const [open, setOpen] = createSignal(false);
  const [instant, setInstant] = createSignal(false);
  const [choice, setChoice] = createSignal<ExportChoice>(savedExportChoice());
  const actions = createExportActions(props, choice).filter(
    action => action.id !== 'image',
  );
  getWhatsNew().bindLocation('export', () => {
    settings.close();
    requestAnimationFrame(() => setOpen(true));
  });

  const toggle = (value: boolean) => {
    if (value) setChoice(savedExportChoice());
    setOpen(value);
  };
  const run = (action: ExportAction) => {
    setOpen(false);
    action.run();
  };
  const download = () => {
    setOpen(false);
    props.exporter.image(choice());
  };
  const isDefault = () => sameExportChoice(choice(), savedExportChoice());

  return (
    <div
      class={shared.group}
      role="group"
      aria-label={t('toolbar.export')}
      data-export
    >
      <Button
        class={shared.main}
        theme={'primary'}
        size={props.size}
        loading={props.exporter.busy()}
        leftIcon={<DownloadIcon />}
        title={t('editor.exportAs', {summary: exportSummary()})}
        data-export-image
        disabled={!props.exporter.ready()}
        onClick={() => props.exporter.image()}
      >
        {t('toolbar.export')}
      </Button>
      <Popover
        open={open()}
        onOpenChange={toggle}
        placement="bottom-end"
        gutter={6}
      >
        <NewDot at="export" filled>
          <Popover.Trigger
            as={IconButton}
            class={shared.more}
            theme={'primary'}
            size={props.size}
            aria-label={t('editor.moreExport')}
            data-export-menu
            onClick={(event: MouseEvent) => setInstant(event.detail === 0)}
          >
            <icons.ChevronDownIcon />
          </Popover.Trigger>
        </NewDot>
        <Popover.Portal>
          <Popover.Content
            class={`${shared.surface} ${styles.panel}`}
            data-instant={instant() || undefined}
            onOpenAutoFocus={(event: Event) => {
              // A click lands on the panel, without a ring on its first control.
              if (instant()) return;
              event.preventDefault();
              (event.currentTarget as HTMLElement).focus();
            }}
          >
            <div class={styles.choose}>
              <div class={styles.head}>
                <Popover.Title as="h2" class={styles.title}>
                  {t('toolbar.export')}
                </Popover.Title>
                <span class={styles.caption}>{t('editor.thisExportOnly')}</span>
              </div>
              <FormatChoice
                layout="tiles"
                choice={choice()}
                onChange={setChoice}
              />
              <ScaleChoice choice={choice()} onChange={setChoice} />
              <QualityChoice choice={choice()} onChange={setChoice} />
              <div class={styles.commit}>
                <Button
                  class={styles.download}
                  theme={'primary'}
                  size={'md'}
                  leftIcon={<DownloadIcon />}
                  disabled={props.exporter.busy()}
                  data-export-action="image"
                  onClick={download}
                >
                  {t('editor.downloadChoice', {
                    summary: exportSummary(choice(), 'short'),
                  })}
                </Button>
                <button
                  type="button"
                  class={fields.textButton}
                  disabled={isDefault()}
                  onClick={() => saveExportChoice(choice())}
                >
                  <Show when={isDefault()} fallback={t('editor.saveAsDefault')}>
                    <CheckIcon size={14} />
                    {t('editor.isDefault')}
                  </Show>
                </button>
              </div>
            </div>
            <div class={styles.actions}>
              <For each={actions}>
                {action => (
                  <Show when={action.visible()}>
                    <button
                      type="button"
                      class={shared.actionRow}
                      disabled={action.disabled()}
                      data-export-action={action.id}
                      onClick={() => run(action)}
                    >
                      <ExportActionContent action={action} />
                    </button>
                  </Show>
                )}
              </For>
            </div>
          </Popover.Content>
        </Popover.Portal>
      </Popover>
    </div>
  );
}
