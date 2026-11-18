import {useI18n} from '@codeimage/locale';
import {icons} from '@ui/kit-icons';
import {Button, IconButton} from '@ui/legacy-controls';
import {onCleanup} from 'solid-js';
import {Popover} from '@ui/Popover';
import type {AppLocaleEntries} from '../../../../i18n';
import {DownloadIcon} from '../../../../components/Icons/Download';
import type {ExportControlProps} from '../ExportControl';
import {AnimationExportContent} from '../export-animation-dialog';
import * as styles from '../export.css';

export function VideoExport(props: ExportControlProps & {onImage: () => void}) {
  const [t] = useI18n<AppLocaleEntries>();
  const animation = () => props.exporter.animation;
  const open = () => props.exporter.exportAnimation();
  const start = () => props.exporter.startAnimation();
  const toggle = (value: boolean) => {
    if (value) open();
    else animation().close();
  };
  const interactOutside = (event: Event) => {
    if (animation().busy() || props.exporter.confirming())
      event.preventDefault();
  };
  onCleanup(() => animation().close());
  const disabled = () => !props.exporter.ready() || !animation().available();
  return (
    <div
      class={styles.group}
      role="group"
      aria-label={t('animation.export.video')}
      data-export
    >
      <Button
        class={styles.main}
        theme="primary"
        size={props.size}
        leftIcon={<DownloadIcon />}
        disabled={disabled()}
        onClick={open}
        data-export-video
      >
        {t('animation.export.video')}
      </Button>
      <Popover
        open={animation().open()}
        onOpenChange={toggle}
        placement="bottom-end"
        gutter={6}
      >
        <Popover.Trigger
          as={IconButton}
          class={styles.more}
          theme="primary"
          size={props.size}
          aria-label={t('editor.moreExport')}
          disabled={disabled()}
          data-export-menu
        >
          <icons.ChevronDownIcon />
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Content
            class={styles.videoPopover}
            onInteractOutside={interactOutside}
          >
            <Popover.Title>{t('animation.export.title')}</Popover.Title>
            <AnimationExportContent
              exporter={animation()}
              onStart={start}
              onImage={props.onImage}
            />
          </Popover.Content>
        </Popover.Portal>
      </Popover>
    </div>
  );
}
