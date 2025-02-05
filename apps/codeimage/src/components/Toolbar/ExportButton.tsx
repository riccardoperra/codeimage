import {useI18n} from '@codeimage/locale';
import {getExportCanvasStore} from '@codeimage/store/canvas';
import {
  Box,
  FieldLabel,
  FieldLabelHint,
  FlexField,
  HStack,
  Link,
  RangeField,
  SegmentedFieldItem,
  toast,
  VStack,
} from '@codeimage/ui';

import {
  Button,
  Checkbox,
  Dialog,
  DialogPanelContent,
  DialogPanelFooter,
  DialogProps,
} from '@codeui/kit';
import {getUmami} from '@core/constants/umami';
import {useModality} from '@core/hooks/isMobile';
import {useWebshare} from '@core/hooks/use-webshare';
import {DynamicSizedContainer} from '@ui/DynamicSizedContainer/DynamicSizedContainer';
import {SegmentedField} from '@ui/SegmentedField/SegmentedField';
import {
  Component,
  createEffect,
  createSignal,
  onMount,
  Show,
  untrack,
} from 'solid-js';
import {useExportSnippet} from '../../hooks/export-snippet';
import {ExportExtension, ExportMode} from '../../hooks/use-export-image';
import {useHotkey} from '../../hooks/use-hotkey';
import {AppLocaleEntries} from '../../i18n';
import {DownloadIcon} from '../Icons/Download';
import {ExclamationIcon} from '../Icons/Exclamation';
import {HintIcon} from '../Icons/Hint';

interface ExportButtonProps {
  canvasRef: HTMLElement | undefined;
}

export const ExportButton: Component<ExportButtonProps> = props => {
  const [t] = useI18n<AppLocaleEntries>();
  const modality = useModality();
  const buttonSize = () => (modality === 'full' ? 'sm' : 'xs');
  const [open, setOpen] = createSignal(false);
  const [data, notify] = useExportSnippet();

  const label = () => t('toolbar.export');

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
          },
        );
      });
    }
  });

  useHotkey(document.body, {
    'Control+s': event => {
      event.preventDefault();
      setOpen(true);
    },
  });

  return (
    <>
      <Button
        theme={'primary'}
        size={buttonSize()}
        loading={data.loading}
        leftIcon={<DownloadIcon />}
        onClick={() => setOpen(true)}
      >
        {label()}
      </Button>

      <ExportDialog
        open={open()}
        onOpenChange={setOpen}
        size={modality === 'mobile' ? 'full' : 'md'}
        onConfirm={payload => {
          notify({
            options: {
              extension: payload.extension,
              mode: payload.type,
              pixelRatio: payload.pixelRatio,
              quality: payload.quality,
            },
            ref: props.canvasRef,
          });
        }}
      />
    </>
  );
};

export type ExportDialogProps = {
  onConfirm: (
    payload:
      | {
          type: ExportMode.export;
          extension: ExportExtension;
          pixelRatio: number;
          quality: number;
        }
      | {
          type: ExportMode.share;
          message: string;
          extension: ExportExtension;
          pixelRatio: number;
          quality: number;
        },
  ) => void;
};

export function ExportDialog(props: ExportDialogProps & DialogProps) {
  const [t] = useI18n<AppLocaleEntries>();
  const [supportWebShare] = useWebshare();
  const exportCanvasStore = getExportCanvasStore();
  const [mode, setMode] = createSignal<ExportMode>(ExportMode.export);
  const [extension, setExtension] = createSignal<ExportExtension>(
    ExportExtension.png,
  );

  const [quality, setQuality] = createSignal<number>(100);

  const [devicePixelRatio, setDevicePixelRatio] = createSignal<number>(
    Math.round(window.devicePixelRatio),
  );

  const modeItems = () =>
    [
      {label: t('export.exportMode'), value: ExportMode.export},
      {label: t('export.shareMode'), value: ExportMode.share},
    ] as SegmentedFieldItem<ExportMode>[];

  const extensionItems: SegmentedFieldItem<ExportExtension>[] = [
    {label: 'PNG', value: ExportExtension.png},
    {label: 'SVG', value: ExportExtension.svg},
    {label: 'JPEG', value: ExportExtension.jpeg},
  ];

  const onConfirm = () => {
    props.onOpenChange?.(false);

    const selectedMode = mode();

    if (selectedMode !== ExportMode.export && selectedMode !== ExportMode.share)
      return;

    const selectedExtension = extension();

    getUmami().track('export-confirm', {
      mode: selectedMode,
      extension: selectedExtension,
    });

    props.onConfirm({
      type: selectedMode,
      extension: selectedExtension,
      pixelRatio: devicePixelRatio(),
      message: '',
      quality: quality() / 100,
    });
  };

  onMount(() => {
    if (!supportWebShare()) {
      setMode(ExportMode.export);
    }
  });

  return (
    <Dialog
      open={props.open}
      onOpenChange={value => props.onOpenChange?.(value)}
      modal={true}
      size={props.size}
      title={t('export.title')}
    >
      <DialogPanelContent>
        <DynamicSizedContainer>
          <VStack spacing={'6'}>
            <Show when={supportWebShare()}>
              <FlexField size={'lg'}>
                <SegmentedField
                  value={mode()}
                  onChange={setMode}
                  items={modeItems()}
                  autoWidth
                  size={'lg'}
                />
                <Show when={mode() === 'share'}>
                  <Box marginTop={1}>
                    <FieldLabelHint
                      size={'sm'}
                      weight={'normal'}
                      icon={() => <HintIcon size={'sm'} />}
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
                </Show>
              </FlexField>
            </Show>

            <FlexField size={'md'}>
              <FieldLabel size={'sm'}>{t('export.extensionType')}</FieldLabel>
              <SegmentedField
                autoWidth
                size={'md'}
                value={extension()}
                onChange={setExtension}
                items={extensionItems}
              />
              <Show when={extension() === 'jpeg'}>
                <Box marginTop={1}>
                  <FieldLabelHint
                    size={'sm'}
                    weight={'normal'}
                    icon={() => <ExclamationIcon size={'sm'} />}
                  >
                    {t('export.noOpacitySupportedWithThisExtension')}
                    &nbsp;
                  </FieldLabelHint>
                </Box>
              </Show>
            </FlexField>

            <Show when={extension() === 'jpeg'}>
              <FlexField size={'md'}>
                <FieldLabel size={'sm'}>
                  {t('export.quality')}
                  <Box as={'span'} marginLeft={3}>
                    <FieldLabelHint>{quality()}%</FieldLabelHint>
                  </Box>
                </FieldLabel>
                <RangeField
                  value={quality()}
                  onChange={setQuality}
                  max={100}
                  min={70}
                  step={2}
                />
              </FlexField>
            </Show>

            <FlexField size={'md'}>
              <FieldLabel size={'sm'}>
                {t('export.pixelRatio')}
                <Box as={'span'} marginLeft={3}>
                  <FieldLabelHint>{devicePixelRatio()}x</FieldLabelHint>
                </Box>
              </FieldLabel>
              <RangeField
                value={devicePixelRatio()}
                onChange={setDevicePixelRatio}
                max={3}
                min={1}
                step={1}
              />
            </FlexField>

            <Checkbox
              checked={exportCanvasStore.get.showOnlyActiveTab}
              onChange={exportCanvasStore.setShowOnlyActiveTab}
              size={'md'}
              label={'Show only active tab'}
            />
          </VStack>
        </DynamicSizedContainer>
      </DialogPanelContent>
      <DialogPanelFooter>
        <HStack spacing={'2'} justifyContent={'flexEnd'}>
          <Button
            block
            size={'md'}
            type="button"
            theme={'secondary'}
            onClick={() => props.onOpenChange?.(false)}
          >
            {t('common.close')}
          </Button>

          <Button
            block
            size={'md'}
            type="submit"
            theme={'primary'}
            onClick={onConfirm}
          >
            {t('common.confirm')}
          </Button>
        </HStack>
      </DialogPanelFooter>
    </Dialog>
  );
}
