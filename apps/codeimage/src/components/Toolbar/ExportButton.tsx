import {Component, createMemo, createSignal} from 'solid-js';
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
import {Transition} from 'solid-headless';
import {Dialog, DialogProps} from '../ui/Dialog/Dialog';
import {
  SegmentedField,
  SegmentedFieldItem,
} from '../ui/SegmentedField/SegmentedField';
import {FlexField} from '../ui/Field/FlexField';
import {TextField} from '../ui/TextField/TextField';
import {FieldLabel} from '../ui/Label/FieldLabel';
import {DialogPanelContent, DialogPanelFooter} from '../ui/Dialog/DialogPanel';

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
        // TODO: https://github.com/riccardoperra/codeimage/issues/42
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        zoom: '1',
        transform: 'scale(1)',
      },
    });
    if (blob) {
      const file = new File([blob], 'file.png', {type: 'image/png'});

      const data = {
        title: 'Codeimage exported image',
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
  const [isOpen, setIsOpen] = createSignal(false);

  function closeModal() {
    setIsOpen(false);
    notify(props.canvasRef);
  }

  function openModal() {
    setIsOpen(true);
  }

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
    <>
      <Button
        variant={'solid'}
        theme={'primary'}
        disabled={data.loading}
        onClick={() => {
          openModal();
          // notify(props.canvasRef)
        }}
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

      <Transition appear show={isOpen()}>
        <ExportDialog
          size={'md'}
          onConfirm={console.log}
          onClose={closeModal}
        />
      </Transition>
    </>
  );
};

export interface ExportDialogProps extends DialogProps {
  onConfirm: (
    payload:
      | {type: 'export'; fileName: string}
      | {type: 'mode'; message: string},
  ) => void;
}

export function ExportDialog(props: DialogProps & ExportDialogProps) {
  type Mode = 'export' | 'share';
  type Extension = 'svg' | 'png' | 'jpeg';
  const [t] = useI18n<AppLocaleEntries>();

  const [mode, setMode] = createSignal<Mode>('share');
  const [extension, setExtension] = createSignal<Extension>('png');
  const [fileName, setFileName] = createSignal<string>('');

  const modeItems: SegmentedFieldItem<Mode>[] = [
    {label: t('export.exportMode'), value: 'export'},
    {label: t('export.shareMode'), value: 'share'},
  ];

  const extensionItems: SegmentedFieldItem<Extension>[] = [
    {label: 'PNG', value: 'png'},
    {label: 'SVG', value: 'svg'},
    {label: 'JPEG', value: 'jpeg'},
  ];

  return (
    <Dialog {...props} isOpen size={'md'} title={t('export.title')}>
      <DialogPanelContent>
        <FlexField size={'lg'}>
          <SegmentedField value={mode()} onChange={setMode} items={modeItems} />
        </FlexField>

        <Box marginTop={'6'}>
          <FlexField size={'md'}>
            <FieldLabel size={'sm'} for={'fileName'}>
              {t('export.fileName')}
            </FieldLabel>
            <TextField
              placeholder={t('export.fileNamePlaceholder')}
              id={'fileName'}
              value={fileName()}
              onChange={setFileName}
              size={'sm'}
              type={'text'}
            />
          </FlexField>
        </Box>

        <Box marginTop={'6'}>
          <FlexField size={'md'}>
            <FieldLabel size={'sm'}>{t('export.extensionType')}</FieldLabel>
            <SegmentedField
              value={extension()}
              onChange={setExtension}
              items={extensionItems}
            />
          </FlexField>
        </Box>
      </DialogPanelContent>
      <DialogPanelFooter>
        <Box display={'flex'} justifyContent={'flexEnd'}>
          <Box marginRight={'2'}>
            <Button
              size={'md'}
              type="button"
              variant={'solid'}
              theme={'secondary'}
              onClick={props.onClose}
            >
              {t('common.close')}
            </Button>
          </Box>

          <Button
            size={'md'}
            type="button"
            variant={'solid'}
            onClick={() => {
              props.onClose?.();
              props.onConfirm({
                fileName: fileName(),
                message: '',
                mode: mode(),
              });
            }}
          >
            {t('common.confirm')}
          </Button>
        </Box>
      </DialogPanelFooter>
    </Dialog>
  );
}
