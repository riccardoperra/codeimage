import {
  Component,
  createEffect,
  createMemo,
  createSignal,
  onMount,
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
import {FieldLabel, FieldLabelHint} from '../ui/Label/FieldLabel';
import {DialogPanelContent, DialogPanelFooter} from '../ui/Dialog/DialogPanel';
import {
  ExportExtension,
  ExportMode,
  useExportImage,
} from '../../hooks/use-export-image';
import {notificationStore} from '../ui/Toast/SnackbarHost';
import {useStaticConfiguration} from '../../core/configuration';
import {RangeField} from '../ui/RangeField/RangeField';
import {Link} from '../ui/Link/Link';
import {FadeInOutTransition} from '../ui/Transition/Transition';

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
        message: () => {
          const [t] = useI18n<AppLocaleEntries>();
          return <>{t('export.genericSaveError')}</>;
        },
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
        <SvgIcon fill="none" viewBox="0 0 24 24" stroke="white">
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
                pixelRatio: payload.pixelRatio,
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
      | {
          type: ExportMode.export;
          fileName: string;
          extension: ExportExtension;
          pixelRatio: number;
        }
      | {
          type: ExportMode.share;
          message: string;
          extension: ExportExtension;
          pixelRatio: number;
        },
  ) => void;
}

export function ExportDialog(props: DialogProps & ExportDialogProps) {
  const [t] = useI18n<AppLocaleEntries>();
  const {support} = useStaticConfiguration();
  const [mode, setMode] = createSignal<ExportMode>(ExportMode.share);
  const [extension, setExtension] = createSignal<ExportExtension>(
    ExportExtension.png,
  );

  const [pxRatio, setPxRatio] = createSignal<number>(window.devicePixelRatio);
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

  onMount(() => {
    if (!support.shareApi) {
      setMode(ExportMode.export);
    }
  });

  return (
    // {TODO: add FieldGroup or Stack component}
    <Dialog {...props} isOpen size={'md'} title={t('export.title')}>
      <DialogPanelContent>
        <Show when={support.shareApi}>
          <Box marginBottom={'6'}>
            <FlexField size={'lg'}>
              <SegmentedField
                value={mode()}
                onChange={setMode}
                items={modeItems}
              />
              <FadeInOutTransition show={mode() === 'share'}>
                <Box marginTop={'1'}>
                  <FieldLabelHint
                    size={'sm'}
                    weight={'normal'}
                    icon={() => (
                      <SvgIcon
                        xmlns="http://www.w3.org/2000/svg"
                        size={'xs'}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        stroke-width="2"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </SvgIcon>
                    )}
                  >
                    {t('export.shareHint')}
                    &nbsp;
                    <Link
                      size={'sm'}
                      underline
                      weight={'medium'}
                      target={'_blank'}
                      href={
                        'https://developer.mozilla.org/en-US/docs/Web/API/Navigator/share'
                      }
                    >
                      Web Share API
                    </Link>
                  </FieldLabelHint>
                </Box>
              </FadeInOutTransition>
            </FlexField>
          </Box>
        </Show>

        <Show when={mode() === 'export'}>
          <Box marginBottom={'6'}>
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

        <Box marginBottom={'6'}>
          <FlexField size={'md'}>
            <FieldLabel size={'sm'}>{t('export.extensionType')}</FieldLabel>
            <SegmentedField
              value={extension()}
              onChange={setExtension}
              items={extensionItems}
            />
          </FlexField>
        </Box>

        <FlexField size={'md'}>
          <FieldLabel size={'sm'}>
            {t('export.pixelRatio')}
            <Box as={'span'} marginLeft={'2'}>
              <FieldLabelHint>({pxRatio}x)</FieldLabelHint>
            </Box>
          </FieldLabel>
          <RangeField
            value={pxRatio()}
            onChange={setPxRatio}
            max={3}
            min={1}
            step={1}
          />
        </FlexField>
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
            type="submit"
            variant={'solid'}
            onClick={() => {
              props.onClose?.();
              props.onConfirm({
                type: mode(),
                extension: extension(),
                fileName: fileName(),
                pixelRatio: pxRatio(),
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
