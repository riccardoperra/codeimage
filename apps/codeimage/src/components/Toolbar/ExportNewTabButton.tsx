import {useI18n} from '@codeimage/locale';
import {Box, Button, useSnackbarStore} from '@codeimage/ui';
import {Component, createEffect} from 'solid-js';
import {
  ExportExtension,
  ExportMode,
  useExportImage,
} from '../../hooks/use-export-image';
import {useHotkey} from '../../hooks/use-hotkey';
import {AppLocaleEntries} from '../../i18n';
import {ExternalLinkIcon} from '../Icons/ExternalLink';

interface ExportButtonProps {
  canvasRef: HTMLElement | undefined;
}

export const ExportInNewTabButton: Component<ExportButtonProps> = props => {
  const snackbarStore = useSnackbarStore();
  const [t] = useI18n<AppLocaleEntries>();

  const [data, notify] = useExportImage();

  const label = () =>
    data.loading ? t('toolbar.exportLoading') : t('toolbar.open');

  function openInTab() {
    notify({
      ref: props.canvasRef,
      options: {
        extension: ExportExtension.png,
        mode: ExportMode.newTab,
        quality: 100,
        pixelRatio: Math.floor(window.devicePixelRatio),
      },
    });
  }

  createEffect(() => {
    if (data.error) {
      snackbarStore.create({
        closeable: true,
        message: () => {
          const [t] = useI18n<AppLocaleEntries>();
          return <>{t('export.genericSaveError')}</>;
        },
      });
    }
  });

  useHotkey(document.body, {
    'Control+o': event => {
      event.preventDefault();
      openInTab();
    },
  });

  return (
    <Button
      variant={'solid'}
      theme={'primaryAlt'}
      disabled={data.loading}
      onClick={() => openInTab()}
    >
      <ExternalLinkIcon />

      <Box as={'span'} marginLeft={2}>
        {label()}
      </Box>
    </Button>
  );
};
