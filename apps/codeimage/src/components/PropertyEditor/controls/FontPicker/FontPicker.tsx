import {EditorConfigStore} from '@codeimage/store/editor/config.store';
import {Box, FlexField, HStack, Text, VStack} from '@codeimage/ui';
import {
  As,
  IconButton,
  icons,
  Listbox,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@codeui/kit';
import {useModality} from '@core/hooks/isMobile';
import {DynamicSizedContainer} from '@ui/DynamicSizedContainer/DynamicSizedContainer';
import {
  ExperimentalFeatureTooltip,
  ExperimentalIcon,
} from '@ui/ExperimentalFeatureTooltip/ExperimentalFeatureTooltip';
import {SegmentedField} from '@ui/SegmentedField/SegmentedField';
import {createSignal, Match, Switch} from 'solid-js';
import {provideState} from 'statebuilder';
import {CloseIcon} from '../../../Icons/CloseIcon';
import * as styles from './FontPicker.css';
import {createFontPickerListboxProps} from './FontPickerListbox';
import {FontSystemPicker} from './FontSystemPicker';

interface FontPickerProps {
  value: string;
  onChange: (value: string) => void;
}

type FontPickerModality = 'default' | 'system';

/**
 * @experimental
 */
export function FontPicker(props: FontPickerProps) {
  const [open, setOpen] = createSignal(false);
  const [mode, setMode] = createSignal<FontPickerModality>('default');
  const modality = useModality();
  const configState = provideState(EditorConfigStore);

  const webListboxItems = () =>
    configState.get.fonts
      .filter(font => font.type === 'web')
      .map(font => ({
        label: font.name,
        value: font.id,
      }));

  const webListboxProps = createFontPickerListboxProps({
    onEsc: () => setOpen(false),
    onChange: props.onChange,
    get value() {
      return props.value;
    },
    get items() {
      return webListboxItems();
    },
  });

  const selectedFont = () =>
    [...configState.get.fonts, ...configState.get.systemFonts].find(
      font => font.id === props.value,
    );

  return (
    <Popover
      placement={modality === 'mobile' ? undefined : 'right-end'}
      open={open()}
      onOpenChange={setOpen}
    >
      <PopoverTrigger asChild>
        <As component={'div'} class={styles.input}>
          <span class={styles.inputValue}>
            {selectedFont()?.name ?? 'No font selected'}
          </span>
          <icons.SelectorIcon class={styles.inputIcon} />
        </As>
      </PopoverTrigger>
      <PopoverContent variant={'bordered'} class={styles.fontPickerPopover}>
        <Box
          display={'flex'}
          justifyContent={'spaceBetween'}
          alignItems={'center'}
          marginBottom={4}
        >
          <ExperimentalFeatureTooltip feature={'Aspect ratio'}>
            <HStack spacing={'2'} alignItems={'flexEnd'}>
              <Text weight={'semibold'}>Fonts</Text>
              <Text class={styles.experimentalFlag} size={'xs'}>
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

        <DynamicSizedContainer>
          <VStack spacing={2}>
            <FlexField>
              <SegmentedField<FontPickerModality>
                value={mode()}
                autoWidth
                onChange={item => setMode(item)}
                items={[
                  {label: 'Default', value: 'default'},
                  {label: 'System', value: 'system'},
                ]}
                size={'sm'}
              />
            </FlexField>

            <Switch>
              <Match when={mode() === 'default'}>
                <Listbox bordered {...webListboxProps} />
              </Match>
              <Match when={mode() === 'system'}>
                <FontSystemPicker
                  onEsc={() => setOpen(false)}
                  value={props.value}
                  onChange={value => props.onChange(value)}
                />
              </Match>
            </Switch>
          </VStack>
        </DynamicSizedContainer>
      </PopoverContent>
    </Popover>
  );
}
