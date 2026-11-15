import {useI18n} from '@codeimage/locale';
import {getExportCanvasStore} from '@codeimage/store/canvas';
import {getFrameState} from '@codeimage/store/editor/frame';
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuTrigger,
  IconButton,
} from '@codeui/kit';
import type {JSX} from 'solid-js';
import {createSignal, For, Show} from 'solid-js';
import {DownloadIcon} from '../../../../components/Icons/Download';
import {NewDot} from '../../../../components/WhatsNew/NewDot';
import {getWhatsNew} from '../../../../state/whats-new';
import type {AppLocaleEntries} from '../../../../i18n';
import type {Exporter} from '../export';
import type {ExportItem} from '../export-actions';
import {createExportActions, ExportActionContent} from '../export-actions';
import {
  EXPORT_FORMATS,
  EXPORT_SCALES,
  exportFormats,
  exportResolution,
  exportSummary,
} from '../export-formats';
import * as shared from '../export.css';
import type {ExportControlProps} from '../ExportControl';
import {CheckIcon, ChevronDownIcon, CopyIcon, EllipsisIcon} from '../icons';
import {settings} from '../settings-state';
import * as styles from './toolbar.css';

/** Menus opened from the keyboard appear at once. */
function createInstant() {
  const [instant, setInstant] = createSignal(false);
  return {
    instant,
    trigger: {
      onPointerDown: () => setInstant(false),
      onKeyDown: () => setInstant(true),
    },
  };
}

/** The export actions as rich rows, from the shared list, without `omit`. */
function ExportMenu(props: {
  exporter: Exporter;
  omit: readonly ExportItem[];
  trigger: (trigger: {
    onPointerDown: () => void;
    onKeyDown: () => void;
  }) => JSX.Element;
}) {
  const [open, setOpen] = createSignal(false);
  const motion = createInstant();
  const actions = createExportActions(props);
  const shown = () => actions.filter(action => !props.omit.includes(action.id));
  getWhatsNew().bindLocation('export', () => {
    settings.close();
    requestAnimationFrame(() => setOpen(true));
  });
  return (
    <DropdownMenu placement="bottom-end" open={open()} onOpenChange={setOpen}>
      <NewDot at="export" filled>
        {props.trigger(motion.trigger)}
      </NewDot>
      <DropdownMenuPortal>
        <DropdownMenuContent
          class={`${shared.surface} ${styles.menu}`}
          data-instant={motion.instant() || undefined}
        >
          <For each={shown()}>
            {action => (
              <Show when={action.visible()}>
                <DropdownMenuItem
                  class={shared.actionRow}
                  disabled={action.disabled()}
                  onSelect={action.run}
                >
                  <ExportActionContent action={action} />
                </DropdownMenuItem>
              </Show>
            )}
          </For>
        </DropdownMenuContent>
      </DropdownMenuPortal>
    </DropdownMenu>
  );
}

/**
 * Variant 2 in the header. On a wide window Export lives in the canvas
 * toolbar, so this shows only on a phone, where the layout places it.
 */
export function ToolbarExport(props: ExportControlProps) {
  const [t] = useI18n<AppLocaleEntries>();
  return (
    <Show when={props.compact}>
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
          onClick={() => props.exporter.image()}
        >
          {t('toolbar.export')}
        </Button>
        <ExportMenu
          exporter={props.exporter}
          omit={['image']}
          trigger={trigger => (
            <DropdownMenuTrigger
              as={IconButton}
              class={shared.more}
              theme={'primary'}
              size={props.size}
              aria-label={t('editor.moreExport')}
              data-export-menu
              {...trigger}
            >
              <EllipsisIcon size={18} />
            </DropdownMenuTrigger>
          )}
        />
      </div>
    </Show>
  );
}

/**
 * Variant 2 in the canvas toolbar: the saved format and scale, always in
 * sight, so a one-off export is one click there and one click back.
 */
export function ToolbarExportCluster(props: {exporter: Exporter}) {
  const [t] = useI18n<AppLocaleEntries>();
  const store = getExportCanvasStore();
  const target = () => getFrameState().exportTarget();
  const format = () => EXPORT_FORMATS[store.get.extension];
  const formatMotion = createInstant();
  const scaleMotion = createInstant();

  return (
    <div
      class={styles.cluster}
      role="group"
      aria-label={t('toolbar.export')}
      data-export
    >
      <span class={styles.gap} />
      <DropdownMenu placement="top">
        <DropdownMenuTrigger
          as={Button}
          class={styles.picker}
          theme={'secondary'}
          variant={'ghost'}
          size={'sm'}
          aria-label={t('editor.exportFormat', {value: format().name})}
          {...formatMotion.trigger}
        >
          {format().name}
          <span class={styles.chevron}>
            <ChevronDownIcon size={14} />
          </span>
        </DropdownMenuTrigger>
        <DropdownMenuPortal>
          <DropdownMenuContent
            class={`${shared.surface} ${styles.pickerMenu}`}
            data-instant={formatMotion.instant() || undefined}
          >
            <For each={exportFormats}>
              {option => (
                <DropdownMenuItem
                  class={shared.actionRow}
                  onSelect={() => store.set('extension', option.extension)}
                >
                  <span class={shared.actionTile} aria-hidden="true">
                    <option.icon size={18} />
                  </span>
                  <span class={shared.actionText}>
                    <span class={shared.actionTitle}>{option.name}</span>
                    <span class={shared.actionDescription}>
                      {t(option.description)}
                    </span>
                  </span>
                  <span class={styles.check}>
                    <Show when={option.extension === store.get.extension}>
                      <CheckIcon size={16} />
                    </Show>
                  </span>
                </DropdownMenuItem>
              )}
            </For>
          </DropdownMenuContent>
        </DropdownMenuPortal>
      </DropdownMenu>
      <DropdownMenu placement="top">
        <DropdownMenuTrigger
          as={Button}
          class={styles.picker}
          theme={'secondary'}
          variant={'ghost'}
          size={'sm'}
          disabled={!!target()}
          title={target() ? exportSummary() : undefined}
          aria-label={t('editor.exportScale', {
            value: `${store.get.devicePixelRatio}x`,
          })}
          {...scaleMotion.trigger}
        >
          {target() ? '1x' : `${store.get.devicePixelRatio}x`}
          <span class={styles.chevron}>
            <ChevronDownIcon size={14} />
          </span>
        </DropdownMenuTrigger>
        <DropdownMenuPortal>
          <DropdownMenuContent
            class={`${shared.surface} ${styles.pickerMenu}`}
            data-instant={scaleMotion.instant() || undefined}
          >
            <For each={EXPORT_SCALES}>
              {scale => (
                <DropdownMenuItem
                  class={`${shared.actionRow} ${styles.scaleRow}`}
                  onSelect={() => store.set('devicePixelRatio', scale)}
                >
                  <span class={styles.scaleValue}>{scale}x</span>
                  <span class={shared.actionDescription}>
                    {t('editor.pixels', {resolution: exportResolution(scale)})}
                  </span>
                  <span class={styles.check}>
                    <Show when={scale === store.get.devicePixelRatio}>
                      <CheckIcon size={16} />
                    </Show>
                  </span>
                </DropdownMenuItem>
              )}
            </For>
          </DropdownMenuContent>
        </DropdownMenuPortal>
      </DropdownMenu>
      <Button
        theme={'secondary'}
        variant={'ghost'}
        size={'sm'}
        leftIcon={<CopyIcon size={18} />}
        disabled={!props.exporter.canCopy() || props.exporter.busy()}
        onClick={() => props.exporter.copy()}
      >
        {t('editor.copyImage')}
      </Button>
      <Button
        theme={'primary'}
        size={'sm'}
        loading={props.exporter.busy()}
        leftIcon={<DownloadIcon />}
        title={t('editor.exportAs', {summary: exportSummary()})}
        data-export-image
        onClick={() => props.exporter.image()}
      >
        {t('editor.download')}
      </Button>
      <ExportMenu
        exporter={props.exporter}
        omit={['image', 'copy']}
        trigger={trigger => (
          <DropdownMenuTrigger
            as={IconButton}
            theme={'secondary'}
            variant={'ghost'}
            size={'sm'}
            aria-label={t('editor.moreExport')}
            data-export-menu
            {...trigger}
          >
            <EllipsisIcon size={18} />
          </DropdownMenuTrigger>
        )}
      />
    </div>
  );
}
