import {useI18n} from '@codeimage/locale';
import type {AppLocaleEntries} from '../../../../i18n';
import {DEFAULT_ASPECT_RATIOS, type getExportTarget} from '@codeimage/config';
import {Box, Text} from '@codeimage/ui';
import {assignInlineVars} from '@vanilla-extract/dynamic';
import {createSignal, For, Show} from 'solid-js';
import {SidebarPopover} from '../../SidebarPopover/SidebarPopover';
import {SidebarPopoverTitle} from '../../SidebarPopover/SidebarPopoverTitle';
import * as styles from './AspetRatioPicker.css';

interface AspectRatioPickerProps {
  value: string | null;
  target: ReturnType<typeof getExportTarget>;
  onTargetChange: (
    value: NonNullable<ReturnType<typeof getExportTarget>>['id'],
  ) => void;
  onChange: (value: string | null) => void;
}

export function AspectRatioPicker(props: AspectRatioPickerProps) {
  const [t] = useI18n<AppLocaleEntries>();
  const target = () => props.target;
  const targetLabel = (
    id: NonNullable<ReturnType<typeof getExportTarget>>['id'],
  ) => t(`frame.targets.${id}`);
  const [open, setOpen] = createSignal(false);

  return (
    <SidebarPopover
      contentClass={styles.aspectRatioPopover}
      input={triggerProps => (
        <button
          type="button"
          aria-label={t('frame.aspectRatio')}
          class={styles.input}
          {...triggerProps}
        >
          <Show when={target()?.ratio ?? props.value}>
            {aspectRatio => (
              <div
                class={styles.aspectRatioPreviewBox}
                style={assignInlineVars({
                  [styles.aspectRatio]: target()?.ratio ?? aspectRatio(),
                })}
              />
            )}
          </Show>

          <Text weight={'semibold'}>
            {target()
              ? targetLabel(target()!.id)
              : (props.value ?? t('frame.freeSize'))}
          </Text>
        </button>
      )}
      open={open()}
      onOpenChange={setOpen}
    >
      <SidebarPopoverTitle
        featureName={t('frame.aspectRatio')}
        onClose={() => setOpen(false)}
      >
        {t('frame.aspectRatio')}
      </SidebarPopoverTitle>

      <div class={styles.aspectRatioCardList}>
        <button
          type="button"
          data-selected={!props.value && !target() ? '' : null}
          class={styles.aspectRatioCardFull}
          onClick={() => props.onChange(null)}
        >
          <div
            style={assignInlineVars({
              [styles.aspectRatio]: 'auto',
            })}
            class={styles.aspectRadioCardPreview}
          >
            <Box marginY={3}>{t('frame.freeSize')}</Box>
          </div>
        </button>

        <For each={DEFAULT_ASPECT_RATIOS}>
          {ratio => (
            <button
              type="button"
              data-selected={
                (target()?.id ?? props.value) ===
                (ratio.kind === 'target' ? ratio.id : ratio.ratio)
                  ? ''
                  : null
              }
              class={styles.aspectRatioCard}
              onClick={() =>
                ratio.kind === 'target'
                  ? props.onTargetChange(ratio.id)
                  : props.onChange(ratio.ratio)
              }
            >
              <div class={styles.aspectRatioCardPreviewWrapper}>
                <div
                  style={assignInlineVars({
                    [styles.aspectRatio]: ratio.ratio,
                  })}
                  class={styles.aspectRadioCardPreview}
                >
                  {ratio.kind === 'target' ? targetLabel(ratio.id) : ratio.name}
                </div>
              </div>
              <span class={styles.aspectRatioCardDetails}>
                {ratio.resolution.join('x')}
              </span>
            </button>
          )}
        </For>
      </div>
    </SidebarPopover>
  );
}
