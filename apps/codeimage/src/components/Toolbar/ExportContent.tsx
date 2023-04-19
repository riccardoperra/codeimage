import {useI18n} from '@codeimage/locale';
import {canvasSize} from '@codeimage/store/canvas';
import {
  Box,
  FieldLabel,
  FieldLabelHint,
  FlexField,
  HStack,
  Link,
  RangeField,
  SegmentedField,
  SegmentedFieldItem,
  Text,
  VStack,
} from '@codeimage/ui';
import {DialogProps, PopoverContent, TextField} from '@codeui/kit';
import {useWebshare} from '@core/hooks/use-webshare';
import {createSignal, onMount, Show} from 'solid-js';
import {ExportExtension, ExportMode} from '../../hooks/use-export-image';
import {AppLocaleEntries} from '../../i18n';
import {ExclamationIcon} from '../Icons/Exclamation';
import {HintIcon} from '../Icons/Hint';
import {ExportDialogProps} from './ExportButton';

export function ExportPopoverContent(props: ExportDialogProps & DialogProps) {
  const [t] = useI18n<AppLocaleEntries>();
  const [supportWebShare] = useWebshare();
  const [mode, setMode] = createSignal<ExportMode>(ExportMode.share);
  const [extension, setExtension] = createSignal<ExportExtension>(
    ExportExtension.png,
  );

  const [quality, setQuality] = createSignal<number>(100);

  const [devicePixelRatio, setDevicePixelRatio] = createSignal<number>(
    Math.round(window.devicePixelRatio),
  );

  const extensionItems: SegmentedFieldItem<ExportExtension>[] = [
    {label: 'PNG', value: ExportExtension.png},
    {label: 'SVG', value: ExportExtension.svg},
    {label: 'JPEG', value: ExportExtension.jpeg},
  ];

  onMount(() => {
    if (!supportWebShare()) {
      setMode(ExportMode.export);
    }
  });

  const canvasResolution = () => {
    const height = Math.ceil(canvasSize.canvasHeight) * devicePixelRatio();
    const width = Math.ceil(canvasSize.canvasWidth) * devicePixelRatio();
    return `${width}x${height}`;
  };

  return (
    <PopoverContent title={'Export Settings'}>
      <VStack spacing={'6'} marginTop={2}>
        <FlexField size={'md'}>
          <FieldLabel size={'sm'}>{t('export.extensionType')}</FieldLabel>
          <SegmentedField
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
          <SegmentedField
            value={devicePixelRatio()}
            onChange={setDevicePixelRatio}
            items={[
              {label: '1x', value: 1},
              {label: '2x', value: 2},
              {label: '3x', value: 3},
            ]}
          />

          <HStack
            spacing={6}
            marginTop={5}
            display={'flex'}
            justifyContent={'spaceBetween'}
            alignItems={'center'}
          >
            <Text size={'sm'}>Output resolution</Text>
            <Box marginLeft={'auto'}>{canvasResolution()}</Box>
          </HStack>
        </FlexField>
      </VStack>
    </PopoverContent>
  );
}
