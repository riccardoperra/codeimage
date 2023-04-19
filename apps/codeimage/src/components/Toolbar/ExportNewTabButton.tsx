import {useI18n} from '@codeimage/locale';
import {LoadingCircle, SvgIcon, toast} from '@codeimage/ui';
import {
  Button,
  IconButton,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@codeui/kit';
import {getUmami} from '@core/constants/umami';
import {useModality} from '@core/hooks/isMobile';
import {As} from '@kobalte/core';
import {Component, createEffect, untrack} from 'solid-js';
import {
  ExportExtension,
  ExportMode,
  useExportImage,
} from '../../hooks/use-export-image';
import {useHotkey} from '../../hooks/use-hotkey';
import {AppLocaleEntries} from '../../i18n';
import {DownloadIcon} from '../Icons/Download';
import {ExternalLinkIcon} from '../Icons/ExternalLink';
import {ExportDialog} from './ExportButton';
import {ExportPopoverContent} from './ExportContent';

interface ExportButtonProps {
  canvasRef: HTMLElement | undefined;
  size?: 'sm' | 'xs';
}

export const ExportInNewTabButton: Component<ExportButtonProps> = props => {
  const modality = useModality();
  const [t] = useI18n<AppLocaleEntries>();

  const [data, notify] = useExportImage();

  const label = () => t('toolbar.openNewTab');

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
    <>
      <div style={{display: 'flex'}}>
        <Button
          theme={'tertiary'}
          leftIcon={<ExternalLinkIcon />}
          loading={data.loading}
          onClick={() => openInTab()}
          size={props.size ?? (modality === 'full' ? 'sm' : 'xs')}
          style={{
            'border-bottom-right-radius': 0,
            'border-top-right-radius': 0,
          }}
        >
          {label()}
        </Button>
        <Popover placement={'bottom-end'}>
          <PopoverTrigger asChild>
            <As
              component={IconButton}
              aria-label={'hint'}
              size={props.size ?? (modality === 'full' ? 'sm' : 'xs')}
              theme={'tertiary'}
              style={{
                'border-bottom-left-radius': 0,
                'border-top-left-radius': 0,
                'border-left': '1px solid rgba(0,0,0,.20)',
              }}
            >
              <SvgIcon
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                class="w-6 h-6"
              >
                <path d="M18.75 12.75h1.5a.75.75 0 000-1.5h-1.5a.75.75 0 000 1.5zM12 6a.75.75 0 01.75-.75h7.5a.75.75 0 010 1.5h-7.5A.75.75 0 0112 6zM12 18a.75.75 0 01.75-.75h7.5a.75.75 0 010 1.5h-7.5A.75.75 0 0112 18zM3.75 6.75h1.5a.75.75 0 100-1.5h-1.5a.75.75 0 000 1.5zM5.25 18.75h-1.5a.75.75 0 010-1.5h1.5a.75.75 0 010 1.5zM3 12a.75.75 0 01.75-.75h7.5a.75.75 0 010 1.5h-7.5A.75.75 0 013 12zM9 3.75a2.25 2.25 0 100 4.5 2.25 2.25 0 000-4.5zM12.75 12a2.25 2.25 0 114.5 0 2.25 2.25 0 01-4.5 0zM9 15.75a2.25 2.25 0 100 4.5 2.25 2.25 0 000-4.5z" />
              </SvgIcon>
            </As>
          </PopoverTrigger>
          <ExportPopoverContent onConfirm={() => void 0} />
        </Popover>
      </div>
    </>
  );
};
