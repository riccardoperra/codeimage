import {DEFAULT_ASPECT_RATIOS} from '@codeimage/config';
import {Box, HStack, Text} from '@codeimage/ui';
import {
  As,
  IconButton,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@codeui/kit';
import {useModality} from '@core/hooks/isMobile';
import {
  ExperimentalFeatureTooltip,
  ExperimentalIcon,
} from '@ui/ExperimentalFeatureTooltip/ExperimentalFeatureTooltip';
import {assignInlineVars} from '@vanilla-extract/dynamic';
import {createSignal, For, Show} from 'solid-js';
import {CloseIcon} from '../../../Icons/CloseIcon';
import * as styles from './AspetRatioPicker.css';

interface AspectRatioPickerProps {
  value: string | null;
  onChange: (value: string | null) => void;
}

/**
 * @experimental
 */
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
      <PopoverContent variant={'bordered'} class={styles.aspectRatioPopover}>
        <Box
          display={'flex'}
          justifyContent={'spaceBetween'}
          alignItems={'center'}
          marginBottom={4}
        >
          <ExperimentalFeatureTooltip feature={'Aspect ratio'}>
            <HStack spacing={'2'} alignItems={'flexEnd'}>
              <Text weight={'semibold'}>Aspect Ratio</Text>
              <Text class={styles.aspectRatioCardDetails} size={'xs'}>
                <Box as={'span'} display={'flex'} alignItems={'center'}>
                  <ExperimentalIcon size={'xs'} />
                  <Box marginLeft={'1'}>Experimental</Box>
                </Box>
              </Text>
            </HStack>
          </ExperimentalFeatureTooltip>

          <IconButton
            size={'xs'}
            aria-label={'Close'}
            theme={'secondary'}
            onClick={() => setOpen(false)}
          >
            <CloseIcon />
          </IconButton>
        </Box>

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

          <For each={DEFAULT_ASPECT_RATIOS}>
            {ratio => (
              <div
                data-selected={props.value === ratio.ratio ? '' : null}
                class={styles.aspectRatioCard}
                onClick={() => props.onChange(ratio.ratio)}
              >
                <div class={styles.aspectRatioCardPreviewWrapper}>
                  <div
                    style={assignInlineVars({
                      [styles.aspectRatio]: ratio.ratio,
                    })}
                    class={styles.aspectRadioCardPreview}
                  >
                    {ratio.name}
                  </div>
                </div>
                <span class={styles.aspectRatioCardDetails}>
                  {ratio.resolution.join('x')}
                </span>
              </div>
            )}
          </For>
        </div>
      </PopoverContent>
    </Popover>
  );
}
