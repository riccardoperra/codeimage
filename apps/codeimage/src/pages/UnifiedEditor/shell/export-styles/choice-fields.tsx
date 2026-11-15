import {useI18n} from '@codeimage/locale';
import {getFrameState} from '@codeimage/store/editor/frame';
import {RangeField} from '@codeimage/ui';
import {RadioGroup} from '@kobalte/core/radio-group';
import {For, Show} from 'solid-js';
import type {ExportExtension} from '../../../../hooks/use-export-image';
import type {AppLocaleEntries} from '../../../../i18n';
import type {ExportChoice} from '../export-formats';
import {
  EXPORT_FORMATS,
  EXPORT_SCALES,
  exportFormats,
  exportResolution,
  JPEG_QUALITY,
} from '../export-formats';
import * as styles from './choice-fields.css';

interface ChoiceProps {
  choice: ExportChoice;
  onChange: (choice: ExportChoice) => void;
}

/** The formats as compact tiles, or as cards that say what each is for. */
export function FormatChoice(props: ChoiceProps & {layout: 'tiles' | 'cards'}) {
  const [t] = useI18n<AppLocaleEntries>();
  return (
    <RadioGroup
      class={styles.field}
      value={props.choice.extension}
      onChange={value =>
        props.onChange({...props.choice, extension: value as ExportExtension})
      }
    >
      <RadioGroup.Label class={styles.label}>
        {t('editor.format')}
      </RadioGroup.Label>
      <div class={styles.options} data-layout={props.layout}>
        <For each={exportFormats}>
          {format => (
            <RadioGroup.Item value={format.extension} class={styles.option}>
              <RadioGroup.ItemInput />
              <RadioGroup.ItemLabel class={styles.optionLabel}>
                <span class={styles.optionIcon} aria-hidden="true">
                  <format.icon size={props.layout === 'cards' ? 22 : 18} />
                </span>
                <span class={styles.optionText}>
                  {format.name}
                  <Show when={props.layout === 'cards'}>
                    <span class={styles.optionHint}>
                      {t(format.description)}
                    </span>
                  </Show>
                </span>
              </RadioGroup.ItemLabel>
            </RadioGroup.Item>
          )}
        </For>
      </div>
    </RadioGroup>
  );
}

/**
 * The scale with the size it gives. A frame with an export target has a
 * fixed size instead, so it shows that.
 */
export function ScaleChoice(props: ChoiceProps) {
  const [t] = useI18n<AppLocaleEntries>();
  const target = () => getFrameState().exportTarget();
  return (
    <Show
      when={!target()}
      fallback={
        <div class={styles.field}>
          <span class={styles.label}>{t('export.pixelRatio')}</span>
          <span class={styles.fixed}>
            {t('editor.targetPixels', {
              name: target() ? t(`frame.targets.${target()!.id}`) : '',
              resolution: target()?.resolution.join(' × ') ?? '',
            })}
          </span>
        </div>
      }
    >
      <RadioGroup
        class={styles.field}
        value={String(props.choice.pixelRatio)}
        onChange={value =>
          props.onChange({...props.choice, pixelRatio: Number(value)})
        }
      >
        <RadioGroup.Label class={styles.label}>
          {t('export.pixelRatio')}
          <span class={styles.value}>
            {t('editor.pixels', {
              resolution: exportResolution(props.choice.pixelRatio),
            })}
          </span>
        </RadioGroup.Label>
        <div class={styles.options}>
          <For each={EXPORT_SCALES}>
            {scale => (
              <RadioGroup.Item value={String(scale)} class={styles.option}>
                <RadioGroup.ItemInput />
                <RadioGroup.ItemLabel class={styles.optionLabel}>
                  {scale}x
                </RadioGroup.ItemLabel>
              </RadioGroup.Item>
            )}
          </For>
        </div>
      </RadioGroup>
    </Show>
  );
}

/** JPEG's quality, only while the choice is a lossy format. */
export function QualityChoice(props: ChoiceProps) {
  const [t] = useI18n<AppLocaleEntries>();
  return (
    <Show when={EXPORT_FORMATS[props.choice.extension].lossy}>
      <div class={styles.field}>
        <span class={styles.label}>
          {t('export.quality')}
          <span class={styles.value}>{props.choice.quality}%</span>
        </span>
        <RangeField
          value={props.choice.quality}
          onChange={quality => props.onChange({...props.choice, quality})}
          min={JPEG_QUALITY.min}
          max={JPEG_QUALITY.max}
          step={JPEG_QUALITY.step}
        />
      </div>
    </Show>
  );
}
