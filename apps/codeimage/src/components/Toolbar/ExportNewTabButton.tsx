import {useI18n} from '@codeimage/locale';
import {Button, toast} from '@codeimage/ui';
import {getUmami} from '@core/constants/umami';
import {useModality} from '@core/hooks/isMobile';
import {Component, createEffect, untrack} from 'solid-js';
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
  size?: 'sm' | 'xs';
}

export const ExportInNewTabButton: Component<ExportButtonProps> = props => {
  const modality = useModality();
  const [t] = useI18n<AppLocaleEntries>();

  const [data, notify] = useExportImage();

  const label = () =>
    data.loading ? t('toolbar.loadingNewTab') : t('toolbar.openNewTab');

  function openInTab() {
    getUmami().trackEvent(`true`, 'export-new-tab');

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
      untrack(() => {
        toast.error(
          () => {
            const [t] = useI18n<AppLocaleEntries>();
            return <>{t('export.genericSaveError')}</>;
          },
          {
            position: 'bottom-center',
            duration: 99999,
          },
        );
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
      loading={data.loading}
      leftIcon={() => <ExternalLinkIcon />}
      onClick={() => openInTab()}
      size={props.size ?? (modality === 'full' ? 'sm' : 'xs')}
    >
      {label()}
    </Button>
  );
};
