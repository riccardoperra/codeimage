import {useI18n} from '@codeimage/locale';
import {getExportCanvasStore} from '@codeimage/store/canvas';
import {
  Box,
  FieldLabel,
  FieldLabelHint,
  FlexField,
  HStack,
  RangeField,
  SegmentedFieldItem,
  Text,
  VStack,
} from '@codeimage/ui';
import {Checkbox, PopoverContent} from '@codeui/kit';
import {DynamicSizedContainer} from '@ui/DynamicSizedContainer/DynamicSizedContainer';
import {SegmentedField} from '@ui/SegmentedField/SegmentedField';
import {createSignal, Show} from 'solid-js';
import {ExportExtension} from '../../hooks/use-export-image';
import {AppLocaleEntries} from '../../i18n';
import {ExclamationIcon} from '../Icons/Exclamation';
import * as styles from './ExportContent.css';

export function ExportPopoverContent() {
  const [t] = useI18n<AppLocaleEntries>();
  const exportCanvasStore = getExportCanvasStore();
  const [quality, setQuality] = createSignal<number>(100);

  const extensionItems: SegmentedFieldItem<ExportExtension>[] = [
    {label: 'PNG', value: ExportExtension.png},
    {label: 'SVG', value: ExportExtension.svg},
    {label: 'JPEG', value: ExportExtension.jpeg},
  ];

  return (
    <PopoverContent
      title={'Export Settings'}
      class={styles.exportContentPopover}
    >
      <DynamicSizedContainer>
        <div class={styles.exportContent}>
          <VStack spacing={'6'} marginTop={2} width={'100%'}>
            <FlexField size={'md'}>
              <FieldLabel size={'sm'}>{t('export.extensionType')}</FieldLabel>
              <SegmentedField
                size={'sm'}
                autoWidth
                value={exportCanvasStore.get.extension}
                onChange={value => exportCanvasStore.set('extension', value)}
                items={extensionItems}
              />
              <Show when={exportCanvasStore.get.extension === 'jpeg'}>
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

            <Show when={exportCanvasStore.get.extension === 'jpeg'}>
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
                  <FieldLabelHint>
                    {exportCanvasStore.get.devicePixelRatio}x
                  </FieldLabelHint>
                </Box>
              </FieldLabel>
              <SegmentedField
                size={'sm'}
                value={exportCanvasStore.get.devicePixelRatio}
                onChange={value =>
                  exportCanvasStore.set('devicePixelRatio', value)
                }
                items={[
                  {label: '1x', value: 1},
                  {label: '2x', value: 2},
                  {label: '3x', value: 3},
                  {label: '6x', value: 6},
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
                <Box marginLeft={'auto'}>
                  {exportCanvasStore.canvasResolution()}
                </Box>
              </HStack>
            </FlexField>

            <Checkbox
              checked={exportCanvasStore.get.showOnlyActiveTab}
              onChange={exportCanvasStore.setShowOnlyActiveTab}
              size={'md'}
              label={'(Export) Show only active tab'}
            />
          </VStack>
        </div>
      </DynamicSizedContainer>
    </PopoverContent>
  );
}
