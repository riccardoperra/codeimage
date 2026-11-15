import {useI18n} from '@codeimage/locale';
import {getExportCanvasStore} from '@codeimage/store/canvas';
import {
  Button,
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
import {WithNewDot} from '../../../components/WhatsNew/NewDot';
import {useHotkey} from '../../../hooks/use-hotkey';
import type {AppLocaleEntries} from '../../../i18n';
import {getWhatsNew} from '../../../state/whats-new';
import type {Exporter} from './export';
import * as styles from './export.css';
import {settings} from './settings-state';

/** What an export gives with the settings now, such as `PNG at 3x`. */
export function exportSummary(): string {
  const canvas = getExportCanvasStore();
  return `${canvas.get.extension.toUpperCase()} at ${canvas.get.devicePixelRatio}x`;
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

  // One image per tab lives in the menu. A Show me from
  // the settings waits a frame, so that the settings close first.
  getWhatsNew().bindLocation('export', () => {
    settings.close();
    requestAnimationFrame(() => setMenuOpen(true));
  });

  // As production's Ctrl+S, which opened the export dialog.
  useHotkey(document.body, {
    'Control+s': event => {
      event.preventDefault();
      exporter().image();
    },
  });

  return (
    <div class={styles.group} role="group" aria-label="Export" data-export>
      <Button
        class={styles.main}
        theme={'primary'}
        size={size()}
        loading={exporter().busy()}
        leftIcon={<DownloadIcon />}
        title={`Export as ${exportSummary()}`}
        data-export-image
        onClick={() => exporter().image()}
      >
        {t('toolbar.export')}
      </Button>
      <DropdownMenu
        placement="bottom-end"
        open={menuOpen()}
        onOpenChange={setMenuOpen}
      >
        <WithNewDot highlight="tabs" filled>
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
        </WithNewDot>
        <DropdownMenuPortal>
          <DropdownMenuContent>
            <DropdownMenuItem onSelect={() => exporter().image()}>
              <span class={styles.item}>
                Export image
                <span class={styles.hint}>{exportSummary()}</span>
              </span>
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={exporter().tabs() < 2}
              onSelect={() => exporter().eachTab()}
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
            <Show when={exporter().secrets() > 0}>
              <DropdownMenuItem onSelect={() => exporter().redactSecrets()}>
                <span class={styles.item}>
                  Redact secrets
                  <span class={styles.hint}>
                    {exporter().secrets() === 1
                      ? 'One secret is visible'
                      : `${exporter().secrets()} secrets are visible`}
                  </span>
                </span>
              </DropdownMenuItem>
            </Show>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => settings.open('export')}>
              Export settings…
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenuPortal>
      </DropdownMenu>
    </div>
  );
}
