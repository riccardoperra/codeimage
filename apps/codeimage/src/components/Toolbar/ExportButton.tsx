import {Component, createMemo, createResource, createSignal} from 'solid-js';
import {Box} from '../ui/Box/Box';
import {Button} from '../ui/Button/Button';
import {useI18n} from '@codeimage/locale';
import {AppLocaleEntries} from '../../i18n';
import {toPng} from 'html-to-image';
import {EXPORT_EXCLUDE} from '../../core/directives/exportExclude';
import download from 'downloadjs';

interface ExportButtonProps {
  canvasRef: HTMLElement | undefined;
}

const exportImage = async (canvasRef: HTMLElement | undefined) => {
  if (!canvasRef) {
    return;
  }
  const result = await toPng(canvasRef, {
    filter: node => !node.hasOwnProperty(EXPORT_EXCLUDE),
  });
  download(result);
  return result;
};

export const ExportButton: Component<ExportButtonProps> = props => {
  const [signal, setSignal] = createSignal<HTMLElement | undefined>(undefined, {
    equals: false,
  });
  const [t] = useI18n<AppLocaleEntries>();
  const [data] = createResource(signal, async ref => {
    // @bad Find another await to prevent flickering
    await new Promise(r => setTimeout(r, 150));
    return exportImage(ref);
  });

  const label = createMemo(() =>
    data.loading ? t('toolbar.exportLoading') : t('toolbar.export'),
  );

  return (
    <Button
      variant={'solid'}
      theme={'primary'}
      disabled={data.loading}
      onClick={() => setSignal(props.canvasRef)}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        style={{height: '20px', width: '20px'}}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width={2}
          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
        />
      </svg>

      <Box as={'span'} marginLeft={'2'}>
        {label()}
      </Box>
    </Button>
  );
};
