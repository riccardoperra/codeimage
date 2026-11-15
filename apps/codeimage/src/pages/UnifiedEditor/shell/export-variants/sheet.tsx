import {useI18n} from '@codeimage/locale';
import {EditorConfigStore} from '@codeimage/store/editor/config.store';
import {Button, Checkbox, IconButton, icons} from '@codeui/kit';
import {Dialog} from '@kobalte/core/dialog';
import {createEffect, createSignal, For, on, onCleanup, Show} from 'solid-js';
import {provideState} from 'statebuilder';
import {DownloadIcon} from '../../../../components/Icons/Download';
import {NewDot} from '../../../../components/WhatsNew/NewDot';
import {
  ExportExtension,
  ExportMode,
  exportImage,
} from '../../../../hooks/use-export-image';
import {getWhatsNew} from '../../../../state/whats-new';
import type {AppLocaleEntries} from '../../../../i18n';
import type {ExportAction, ExportItem} from '../export-actions';
import {createExportActions, ExportActionContent} from '../export-actions';
import type {ExportChoice} from '../export-formats';
import {
  exportSummary,
  saveExportChoice,
  savedExportChoice,
} from '../export-formats';
import * as shared from '../export.css';
import type {ExportControlProps} from '../ExportControl';
import {settings} from '../settings-state';
import {FormatChoice, QualityChoice, ScaleChoice} from './choice-fields';
import * as styles from './sheet.css';

const DESTINATIONS: readonly ExportItem[] = ['share', 'new-tab', 'copy'];

/**
 * Variant 3. "Export…" opens a dialog with the image, the choice for this
 * export and where it goes. Ctrl+S still exports at once with the saved
 * settings.
 */
export function SheetExport(props: ExportControlProps) {
  const [t] = useI18n<AppLocaleEntries>();
  const config = provideState(EditorConfigStore);
  const [open, setOpen] = createSignal(false);
  const [instant, setInstant] = createSignal(false);
  const [choice, setChoice] = createSignal<ExportChoice>(savedExportChoice());
  const [remember, setRemember] = createSignal(false);
  const [preview, setPreview] = createSignal<string>();
  const actions = createExportActions(props, choice);
  const byId = (id: ExportItem) => actions.find(action => action.id === id)!;
  const destinations = DESTINATIONS.map(byId);
  const others = actions.filter(
    action => action.id !== 'image' && !DESTINATIONS.includes(action.id),
  );
  getWhatsNew().bindLocation('export', () => {
    settings.close();
    requestAnimationFrame(() => toggle(true));
  });

  const toggle = (value: boolean) => {
    if (value) {
      setChoice(savedExportChoice());
      setRemember(false);
    }
    setOpen(value);
  };

  // A quick, small render of what the export captures.
  createEffect(
    on(open, isOpen => {
      if (!isOpen) return;
      let url: string | undefined;
      let cancelled = false;
      exportImage({
        ref: props.exportRef(),
        renderer: config.get.renderer,
        options: {
          extension: ExportExtension.png,
          mode: ExportMode.getBlob,
          pixelRatio: 1,
          quality: 1,
        },
      })
        .then(blob => {
          if (cancelled || !(blob instanceof Blob)) return;
          url = URL.createObjectURL(blob);
          setPreview(url);
        })
        .catch(() => undefined);
      onCleanup(() => {
        cancelled = true;
        setPreview(undefined);
        if (url) URL.revokeObjectURL(url);
      });
    }),
  );

  const run = (action: ExportAction) => {
    if (remember() && action.id !== 'settings') saveExportChoice(choice());
    setOpen(false);
    action.run();
  };

  return (
    <div class={shared.group} data-export>
      <NewDot at="export" filled>
        <Button
          theme={'primary'}
          size={props.size}
          leftIcon={<DownloadIcon />}
          loading={props.exporter.busy()}
          title={t('editor.exportAs', {summary: exportSummary()})}
          aria-haspopup="dialog"
          data-export-image
          data-export-menu
          onClick={(event: MouseEvent) => {
            setInstant(event.detail === 0);
            toggle(true);
          }}
        >
          {t('editor.exportEllipsis')}
        </Button>
      </NewDot>
      <Dialog open={open()} onOpenChange={toggle}>
        <Dialog.Portal>
          <Dialog.Overlay class={styles.backdrop} />
          <div class={styles.position}>
            <Dialog.Content
              class={styles.sheet}
              data-instant={instant() || undefined}
              data-export-sheet
            >
              <div class={styles.head}>
                <Dialog.Title as="h2" class={styles.title}>
                  {t('toolbar.export')}
                </Dialog.Title>
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
              <div class={styles.body}>
                <div class={styles.preview}>
                  <Show when={preview()}>
                    {url => (
                      <img
                        class={styles.image}
                        src={url()}
                        alt={t('editor.imagePreview')}
                      />
                    )}
                  </Show>
                </div>
                <div class={styles.choices}>
                  <FormatChoice
                    layout="cards"
                    choice={choice()}
                    onChange={setChoice}
                  />
                  <ScaleChoice choice={choice()} onChange={setChoice} />
                  <QualityChoice choice={choice()} onChange={setChoice} />
                  <Checkbox
                    label={t('editor.rememberDefault')}
                    checked={remember()}
                    onChange={setRemember}
                  />
                </div>
              </div>
              <div class={styles.footer}>
                <For each={destinations}>
                  {action => (
                    <Show when={action.visible()}>
                      <Button
                        theme={'secondary'}
                        size={'md'}
                        leftIcon={<action.icon size={18} />}
                        disabled={action.disabled()}
                        onClick={() => run(action)}
                      >
                        {action.title()}
                      </Button>
                    </Show>
                  )}
                </For>
                <Button
                  class={styles.download}
                  theme={'primary'}
                  size={'md'}
                  leftIcon={<DownloadIcon />}
                  disabled={byId('image').disabled()}
                  onClick={() => run(byId('image'))}
                >
                  {t('editor.downloadChoice', {
                    summary: exportSummary(choice(), 'short'),
                  })}
                </Button>
              </div>
              <section class={styles.moreSection}>
                <h3 class={styles.moreTitle}>{t('editor.more')}</h3>
                <div class={styles.more}>
                  <For each={others}>
                    {action => (
                      <Show when={action.visible()}>
                        <button
                          type="button"
                          class={shared.actionRow}
                          disabled={action.disabled()}
                          onClick={() => run(action)}
                        >
                          <ExportActionContent action={action} />
                        </button>
                      </Show>
                    )}
                  </For>
                </div>
              </section>
            </Dialog.Content>
          </div>
        </Dialog.Portal>
      </Dialog>
    </div>
  );
}
