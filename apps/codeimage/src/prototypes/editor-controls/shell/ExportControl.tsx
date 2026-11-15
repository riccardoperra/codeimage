import {useI18n} from '@codeimage/locale';
import {getExportCanvasStore} from '@codeimage/store/canvas';
import {getFrameState} from '@codeimage/store/editor/frame';
import {
  Button,
  Dialog,
  DialogPanelContent,
  DialogPanelFooter,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  IconButton,
  icons,
} from '@codeui/kit';
import {createSignal, Show} from 'solid-js';
import {DownloadIcon} from '../../../components/Icons/Download';
import {NewDot} from '../../../components/WhatsNew/NewDot';
import {getWhatsNew} from '../../../state/whats-new';
import {useHotkey} from '../../../hooks/use-hotkey';
import type {AppLocaleEntries} from '../../../i18n';
import type {Exporter} from './export';
import * as styles from './export.css';
import {settings} from './settings-state';

/** What an export gives with the settings now, such as `PNG at 3x`. */
export function exportSummary(): string {
  const canvas = getExportCanvasStore();
  const target = getFrameState().exportTarget();
  const size = target
    ? target.resolution.join(' × ')
    : `${canvas.get.devicePixelRatio}x`;
  return `${canvas.get.extension.toUpperCase()} at ${size}`; // i18n
}

/**
 * Export in two parts. The button exports the image at once with the export
 * settings; the arrow beside it offers one image per tab and the settings.
 * One image per tab stays in the list with its reason while the snippet has
 * one tab, so that it can be found before it is needed.
 */
export function ExportControl(props: {exporter: Exporter; size?: 'sm' | 'xs'}) {
  const [t] = useI18n<AppLocaleEntries>();
  const exporter = () => props.exporter;
  const size = () => props.size ?? 'sm';
  const [menuOpen, setMenuOpen] = createSignal(false);
  getWhatsNew().bindLocation('export', () => {
    settings.close();
    requestAnimationFrame(() => setMenuOpen(true));
  });
  const copyLabel = 'Copy to clipboard'; // i18n
  const redactedLabel = 'Secrets redacted. Ready to export.'; // i18n

  const exportImage = () => exporter().image();
  const exportEachTab = () => exporter().eachTab();
  const share = () => exporter().share();
  const copy = () => exporter().copy();
  const copyAltText = () => exporter().copyAltText();
  const newTab = () => exporter().newTab();
  const redactSecrets = () => exporter().redactSecrets();
  const openSettings = () => settings.open('export');
  const closeConfirmation = (open: boolean) => {
    if (!open) exporter().cancel();
  };
  const cancel = () => exporter().cancel();
  const confirm = () => exporter().confirm();

  // Studio still mounts production's Ctrl+O button on the body.
  useHotkey(window, {
    'Control+o': event => {
      if (event.defaultPrevented) return;
      event.preventDefault();
      newTab();
    },
  });
  useHotkey(document.body, {
    'Control+s': event => {
      event.preventDefault();
      exportImage();
    },
  });

  return (
    <>
      <div
        class={styles.group}
        role="group"
        aria-label={t('toolbar.export')}
        data-export
      >
        <Button
          class={styles.main}
          theme={'primary'}
          size={size()}
          loading={exporter().busy()}
          leftIcon={<DownloadIcon />}
          title={`Export as ${exportSummary()}`}
          data-export-image
          onClick={exportImage}
        >
          {t('toolbar.export')}
        </Button>
        <DropdownMenu
          placement="bottom-end"
          open={menuOpen()}
          onOpenChange={setMenuOpen}
        >
          <NewDot at="export" filled>
            <DropdownMenuTrigger
              as={IconButton}
              class={styles.more}
              theme={'primary'}
              size={size()}
              aria-label="More ways to export"
              data-export-menu
            >
              <icons.ChevronDownIcon />
            </DropdownMenuTrigger>
          </NewDot>
          <DropdownMenuPortal>
            <DropdownMenuContent>
              <DropdownMenuItem
                disabled={exporter().busy()}
                onSelect={exportImage}
              >
                <span class={styles.item}>
                  Export image
                  <span class={styles.hint}>{exportSummary()}</span>
                </span>
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={exporter().tabs() < 2 || exporter().busy()}
                onSelect={exportEachTab}
              >
                <span class={styles.item}>
                  Export one image per tab
                  <span class={styles.hint}>
                    {exporter().tabs() < 2
                      ? 'Needs two tabs or more'
                      : `${exporter().tabs()} images in a zip`}
                  </span>
                </span>
              </DropdownMenuItem>
              <Show when={exporter().canShare()}>
                <DropdownMenuItem disabled={exporter().busy()} onSelect={share}>
                  {t('export.shareMode')}
                </DropdownMenuItem>
              </Show>
              <DropdownMenuItem
                disabled={!exporter().canCopy() || exporter().busy()}
                onSelect={copy}
              >
                {copyLabel}
              </DropdownMenuItem>
              <DropdownMenuItem disabled={exporter().busy()} onSelect={newTab}>
                {t('toolbar.openNewTab')}
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={!exporter().canCopyAltText()}
                onSelect={copyAltText}
              >
                {t('altText.copy')}
              </DropdownMenuItem>
              <Show when={exporter().secrets() > 0}>
                <DropdownMenuItem onSelect={redactSecrets}>
                  <span class={styles.item}>
                    {t('secrets.redactAll')}
                    <span class={styles.hint}>
                      {exporter().secrets() === 1
                        ? t('secrets.visibleOne')
                        : t('secrets.visible', {
                            count: String(exporter().secrets()),
                          })}
                    </span>
                  </span>
                </DropdownMenuItem>
              </Show>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={openSettings}>
                Export settings…
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenuPortal>
        </DropdownMenu>
      </div>
      <Dialog
        open={exporter().confirming()}
        onOpenChange={closeConfirmation}
        title={t('export.title')}
        size="sm"
      >
        <DialogPanelContent>
          <div class={styles.warning}>
            <Show when={exporter().secrets() > 0}>
              <div role="status">
                {exporter().secrets() === 1
                  ? t('secrets.visibleOne')
                  : t('secrets.visible', {count: String(exporter().secrets())})}
              </div>
              <p class={styles.hint}>{t('secrets.destructiveHint')}</p>
              <Button size="sm" theme="secondary" onClick={redactSecrets}>
                {t('secrets.redactAll')}
              </Button>
            </Show>
            <Show when={exporter().secrets() === 0}>
              <div role="status">{redactedLabel}</div>
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
      </Dialog>
    </>
  );
}
