import {Box, Text} from '@codeimage/ui';
import {Popover, PopoverContent, PopoverTrigger} from '@codeui/kit';
import {useModality} from '@core/hooks/isMobile';
import {As} from '@kobalte/core';
import {assignInlineVars} from '@vanilla-extract/dynamic';
import {createSignal, For, Show} from 'solid-js';
import * as styles from './AspetRatioPicker.css';

interface AspectRatioPickerProps {
  value: string | null;
  onChange: (value: string | null) => void;
}

export function AspectRatioPicker(props: AspectRatioPickerProps) {
  const [open, setOpen] = createSignal(false);
  const modality = useModality();

  return (
    <Popover
      placement={modality === 'mobile' ? undefined : 'right-start'}
      open={open()}
      onOpenChange={setOpen}
    >
      <PopoverTrigger asChild>
        <As component={'div'} class={styles.input}>
          <Show when={props.value}>
            {aspectRatio => (
              <div
                class={styles.aspectRatioPreviewBox}
                style={assignInlineVars({
                  [styles.aspectRatio]: aspectRatio(),
                })}
              />
            )}
          </Show>

          <Text weight={'semibold'}>{props.value ?? 'Auto'}</Text>
        </As>
      </PopoverTrigger>
      <PopoverContent class={styles.aspectRatioPopover}>
        <div class={styles.aspectRatioCardList}>
          <div
            data-selected={!props.value ? '' : null}
            class={styles.aspectRatioCardFull}
            onClick={() => props.onChange(null)}
          >
            <div
              style={assignInlineVars({
                [styles.aspectRatio]: 'auto',
              })}
              class={styles.aspectRadioCardPreview}
            >
              <Box marginY={3}>Auto</Box>
            </div>
          </div>

          <For each={['16 / 9', '3 / 2', '4 / 3', '5 / 4', '1 / 1', '9 / 16']}>
            {size => (
              <div
                data-selected={props.value === size ? '' : null}
                class={styles.aspectRatioCard}
                onClick={() => props.onChange(size)}
              >
                <div
                  style={assignInlineVars({
                    [styles.aspectRatio]: size,
                  })}
                  class={styles.aspectRadioCardPreview}
                >
                  {size}
                </div>
              </div>
            )}
          </For>
        </div>
      </PopoverContent>
    </Popover>
  );
}
