import {useI18n} from '@codeimage/locale';
import {getExportCanvasStore} from '@codeimage/store/canvas';
import {toast} from '@codeimage/ui';
import {Button} from '@codeui/kit';
import {getUmami} from '@core/constants/umami';
import {useModality} from '@core/hooks/isMobile';
import {Component, createEffect, untrack} from 'solid-js';
import {useExportSnippet} from '../../hooks/export-snippet';
import {ExportMode} from '../../hooks/use-export-image';
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

  const [data, notify] = useExportSnippet();

  const label = () => t('toolbar.openNewTab');

  function openInTab() {
    getUmami().track('export-new-tab');
    const exportSettings = getExportCanvasStore();
    notify({
      ref: props.canvasRef,
      options: {
        extension: exportSettings.get.extension,
        mode: ExportMode.newTab,
        quality: exportSettings.get.jpegQuality,
        pixelRatio: Math.floor(exportSettings.get.devicePixelRatio),
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
      theme={'tertiary'}
      leftIcon={<ExternalLinkIcon />}
      loading={data.loading}
      onClick={() => openInTab()}
      size={props.size ?? (modality === 'full' ? 'sm' : 'xs')}
    >
      {label()}
    </Button>
  );
};
