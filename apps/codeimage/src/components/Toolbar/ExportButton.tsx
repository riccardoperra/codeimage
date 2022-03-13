import {
  Component,
  createEffect,
  createMemo,
  createSignal,
  Show,
} from 'solid-js';
import {Box} from '../ui/Box/Box';
import {Button} from '../ui/Button/Button';
import {useI18n} from '@codeimage/locale';
import {AppLocaleEntries} from '../../i18n';
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
import {
  ExportExtension,
  ExportMode,
  useExportImage,
} from '../../hooks/use-export-image';
import {notificationStore} from '../ui/Toast/SnackbarHost';

interface ExportButtonProps {
  canvasRef: HTMLElement | undefined;
}

export const ExportButton: Component<ExportButtonProps> = props => {
  const [isOpen, setIsOpen] = createSignal(false);
  const [t] = useI18n<AppLocaleEntries>();

  const [data, notify] = useExportImage();

  const label = createMemo(() =>
    data.loading ? t('toolbar.exportLoading') : t('toolbar.export'),
  );

  function closeModal() {
    setIsOpen(false);
  }

  function openModal() {
    setIsOpen(true);
  }

  createEffect(() => {
    if (data.error) {
      notificationStore.create({
        closeable: true,
        message: 'Si é verificato un errore durante il salvataggio',
      });
    }
  });

  return (
    <>
      <Button
        variant={'solid'}
        theme={'primary'}
        disabled={data.loading}
        onClick={() => openModal()}
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
          onClose={closeModal}
          onConfirm={payload => {
            notify({
              options: {
                extension: payload.extension,
                fileName:
                  payload.type === 'export' ? payload.fileName : undefined,
                mode: payload.type,
              },
              ref: props.canvasRef,
            });

            closeModal();
          }}
        />
      </Transition>
    </>
  );
};

export interface ExportDialogProps extends DialogProps {
  onConfirm: (
    payload:
      | {type: ExportMode.export; fileName: string; extension: ExportExtension}
      | {type: ExportMode.share; message: string; extension: ExportExtension},
  ) => void;
}

export function ExportDialog(props: DialogProps & ExportDialogProps) {
  const [t] = useI18n<AppLocaleEntries>();

  const [mode, setMode] = createSignal<ExportMode>(ExportMode.share);
  const [extension, setExtension] = createSignal<ExportExtension>(
    ExportExtension.png,
  );

  const [fileName, setFileName] = createSignal<string>('');

  const modeItems: SegmentedFieldItem<ExportMode>[] = [
    {label: t('export.shareMode'), value: ExportMode.share},
    {label: t('export.exportMode'), value: ExportMode.export},
  ];

  const extensionItems: SegmentedFieldItem<ExportExtension>[] = [
    {label: 'PNG', value: ExportExtension.png},
    {label: 'SVG', value: ExportExtension.svg},
    {label: 'JPEG', value: ExportExtension.jpeg},
  ];

  return (
    <Dialog {...props} isOpen size={'md'} title={t('export.title')}>
      <DialogPanelContent>
        <FlexField size={'lg'}>
          <SegmentedField value={mode()} onChange={setMode} items={modeItems} />
        </FlexField>

        <Show when={mode() === 'export'}>
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
        </Show>

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
                type: mode(),
                extension: extension(),
                fileName: fileName(),
                message: '',
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
