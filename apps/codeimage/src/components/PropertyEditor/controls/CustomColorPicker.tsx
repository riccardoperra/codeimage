import {AVAILABLE_COLORS, AVAILABLE_GRADIENTS} from '@codeimage/config';
import {backgroundColorVar, Box, ColorPickerPopover, Text} from '@codeimage/ui';
import {IconButton, Popover, PopoverContent, PopoverTrigger} from '@codeui/kit';
import {useModality} from '@core/hooks/isMobile';
import {As} from '@kobalte/core';
import {assignInlineVars} from '@vanilla-extract/dynamic';
import {createSignal} from 'solid-js';
import {CloseIcon} from '../../Icons/CloseIcon';
import * as styles from './CustomColorPicker.css';

export type CustomColorPickerProps = Parameters<
  typeof ColorPickerPopover
>[0] & {
  value: string | undefined;
  onChange: (value: string) => void;
};

export function CustomColorPicker(props: CustomColorPickerProps) {
  const modality = useModality();
  const [open, setOpen] = createSignal(false);
  return (
    <Popover
      placement={modality === 'mobile' ? undefined : 'right-start'}
      isOpen={open()}
      onOpenChange={setOpen}
    >
      <PopoverTrigger asChild>
        <As component={'div'} class={styles.input}>
          <div
            class={styles.inputColor}
            style={assignInlineVars({
              [backgroundColorVar]: props.value ?? '#000000',
            })}
          />
        </As>
      </PopoverTrigger>
      <PopoverContent title={''}>
        <Box
          display={'flex'}
          justifyContent={'spaceBetween'}
          alignItems={'center'}
          marginBottom={4}
        >
          <Text weight={'semibold'}>Color</Text>
          <IconButton
            size={'xs'}
            aria-label={'Close'}
            theme={'secondary'}
            onClick={() => setOpen(false)}
          >
            <CloseIcon />
          </IconButton>
        </Box>

        <ColorPickerPopover
          value={props.value}
          onChange={props.onChange}
          colors={AVAILABLE_COLORS}
          gradientColors={AVAILABLE_GRADIENTS}
        />
      </PopoverContent>
    </Popover>
  );
}
