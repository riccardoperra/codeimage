import {getExportCanvasStore} from '@codeimage/store/canvas';
import {getFrameState} from '@codeimage/store/editor/frame';
import {RangeField} from '@codeimage/ui';
import {CopyAltTextButton} from '../../../components/Toolbar/CopyAltTextButton';
import {ExportExtension} from '../../../hooks/use-export-image';
import {EXPORT_SCALES, exportFormats, JPEG_QUALITY} from './export-formats';
import {useI18n} from '@codeimage/locale';
import {createMemo, Show} from 'solid-js';
import type {AppLocaleEntries} from '../../../i18n';
import {SwitchField} from '../controls/fields';
import {ExportIcon} from './icons';
import type {SettingSection} from './sections';
import {Segmented} from './settings-segmented';
import * as styles from './settings.css';

export function createExportSection() {
  const [t] = useI18n<AppLocaleEntries>();
  const exportStore = getExportCanvasStore();
  const target = () => getFrameState().exportTarget();
  const groups = createMemo(() => [
    {
      title: t('editor.image'),
      rows: [
        {
          id: 'export-format' as const,
          title: t('editor.format'),
          description: () =>
            exportStore.get.extension === ExportExtension.jpeg
              ? t('editor.jpegHint')
              : t('editor.formatHint'),
          control: () => (
            <Segmented
              value={exportStore.get.extension}
              onChange={value => exportStore.set('extension', value)}
              items={exportFormats.map(format => ({
                label: format.name,
                value: format.extension,
              }))}
            />
          ),
        },
        ...(exportStore.get.extension === ExportExtension.jpeg
          ? [
              {
                id: 'export-quality' as const,
                title: t('export.quality'),
                description: () =>
                  t('editor.qualityHint', {
                    quality: String(exportStore.get.jpegQuality),
                  }),
                control: () => (
                  <div class={styles.range}>
                    <RangeField
                      value={exportStore.get.jpegQuality}
                      onChange={value => exportStore.set('jpegQuality', value)}
                      min={JPEG_QUALITY.min}
                      max={JPEG_QUALITY.max}
                      step={JPEG_QUALITY.step}
                    />
                  </div>
                ),
              },
            ]
          : []),
        {
          id: 'export-scale' as const,
          title: t('export.pixelRatio'),
          description: () => {
            const frameTarget = target();
            return frameTarget
              ? t('editor.targetPixels', {
                  name: t(`frame.targets.${frameTarget.id}`),
                  resolution: frameTarget.resolution.join(' × '),
                })
              : t('editor.imagePixels', {
                  resolution: exportStore.canvasResolution(),
                });
          },
          control: () => (
            <Show
              when={!target()}
              fallback={
                <span class={styles.value}>
                  {getFrameState().exportPixelRatio(
                    exportStore.get.devicePixelRatio,
                  )}
                  x
                </span>
              }
            >
              <Segmented
                value={String(exportStore.get.devicePixelRatio)}
                onChange={value =>
                  exportStore.set('devicePixelRatio', Number(value))
                }
                items={EXPORT_SCALES.map(scale => ({
                  label: `${scale}x`,
                  value: String(scale),
                }))}
              />
            </Show>
          ),
        },
        {
          id: 'export-alt-text' as const,
          title: t('altText.copy'),
          description: () => t('altText.hint'),
          small: true,
          control: () => <CopyAltTextButton />,
        },
      ],
    },
    {
      title: t('editor.tabs'),
      rows: [
        {
          id: 'export-active-tab' as const,
          title: t('exportTabs.showOnlyActiveTab'),
          description: () => t('editor.activeTabHint'),
          small: true,
          control: () => (
            <SwitchField
              id="settings-export-active-tab"
              label={t('exportTabs.showOnlyActiveTab')}
              checked={exportStore.get.showOnlyActiveTab}
              onChange={exportStore.setShowOnlyActiveTab}
            />
          ),
        },
      ],
    },
  ]);

  return {
    id: 'export' as const,
    get name() {
      return t('toolbar.export');
    },
    icon: ExportIcon,
    get intro() {
      return t('editor.exportHint');
    },
    groups,
  } satisfies SettingSection;
}
