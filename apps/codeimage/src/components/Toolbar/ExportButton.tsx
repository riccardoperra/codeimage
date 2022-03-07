import {Component, createMemo} from 'solid-js';
import {Box} from '../ui/Box/Box';
import {Button} from '../ui/Button/Button';
import {useI18n} from '@codeimage/locale';
import {AppLocaleEntries} from '../../i18n';
import {toBlob, toPng} from 'html-to-image';
import {EXPORT_EXCLUDE} from '../../core/directives/exportExclude';
import download from 'downloadjs';
import {useAsyncAction} from '../../core/hooks/async-action';
import {useModality} from '../../core/hooks/isMobile';
import {SvgIcon} from '../ui/SvgIcon/SvgIcon';

interface ExportButtonProps {
  canvasRef: HTMLElement | undefined;
}

const exportImage = async (canvasRef: HTMLElement | undefined) => {
  if (!canvasRef) {
    return;
  }

  const mobile = useModality() === 'mobile';

  if (mobile && !!navigator.share) {
    const blob = await toBlob(canvasRef, {
      filter: node => !node.hasOwnProperty(EXPORT_EXCLUDE),
      style: {
        transform: 'scale(1)',
      },
    });
    if (blob) {
      const file = new File([blob], 'file.png', {type: 'image/png'});

      const data = {
        title: 'Codeimage exported image',
        text: 'Saved with codeimage.',
        files: [file],
      };

      if (navigator.canShare(data)) {
        navigator.share(data).then(alert).catch(alert);
      }
      return blob;
    }
  } else {
    const result = await toPng(canvasRef, {
      filter: node => !node.hasOwnProperty(EXPORT_EXCLUDE),
    });
    download(result);
    return result;
  }
};

export const ExportButton: Component<ExportButtonProps> = props => {
  const [t] = useI18n<AppLocaleEntries>();
  const [data, {notify}] = useAsyncAction(
    async (ref: HTMLElement | undefined) => {
      // @bad Find another await to prevent flickering
      await new Promise(r => setTimeout(r, 150));
      return exportImage(ref);
    },
  );

  const label = createMemo(() =>
    data.loading ? t('toolbar.exportLoading') : t('toolbar.export'),
  );

  return (
    <Button
      variant={'solid'}
      theme={'primary'}
      disabled={data.loading}
      onClick={() => notify(props.canvasRef)}
    >
      <SvgIcon fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width={2}
          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
        />
      </SvgIcon>

      <Box as={'span'} marginLeft={'2'}>
        {label()}
      </Box>
    </Button>
  );
};
