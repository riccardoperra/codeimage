import {useI18n} from '@codeimage/locale';
import {
  Accessor,
  createEffect,
  createMemo,
  createSignal,
  For,
  on,
  onMount,
  Show,
  VoidProps,
} from 'solid-js';
import {VStack} from '../Box';
import {FlexField} from '../Field';
import {SegmentedField, SegmentedFieldItem} from '../SegmentedField';
import {TextField} from '../TextField';
import * as styles from './ColorPicker.css';
import {ColorPickerPresetItem} from './ColorPickerPresetItem';

enum ColorPickerSelectionMode {
  gradient = 'gradient',
  color = 'color',
}

export interface ColorPickerPopoverProps {
  value?: string | null;
  onChange: (value: string) => void;
  gradientColors?: string[];
  colors?: string[];
}

export function ColorPickerPopover(props: VoidProps<ColorPickerPopoverProps>) {
  const [internalColor, setInternalColor] = createSignal<string>();
  const [mode, setMode] = createSignal(ColorPickerSelectionMode.gradient);
  const [, {tUnsafe}] = useI18n();
  createEffect(on(() => props.value ?? '', setInternalColor));

  const modalities: Accessor<SegmentedFieldItem<ColorPickerSelectionMode>[]> =
    createMemo(() => [
      {
        label: tUnsafe('colorPicker.gradient'),
        value: ColorPickerSelectionMode.gradient,
      },
      {
        label: tUnsafe('colorPicker.color'),
        value: ColorPickerSelectionMode.color,
      },
    ]);

  onMount(() => {
    if (props.colors?.includes(props.value ?? '')) {
      setMode(ColorPickerSelectionMode.color);
    } else {
      setMode(ColorPickerSelectionMode.gradient);
    }
  });

  return (
    <VStack spacing={4}>
      <FlexField size={'md'}>
        <SegmentedField
          value={mode()}
          onChange={setMode}
          items={modalities()}
        />
      </FlexField>

      <FlexField size={'xs'}>
        <TextField
          size={'xs'}
          type={'text'}
          value={internalColor()}
          onChange={value => props.onChange(value)}
          tabIndex={-1}
        />
      </FlexField>

      <Show when={mode() === ColorPickerSelectionMode.color}>
        <div class={styles.colorGrid}>
          <For each={props.colors}>
            {item => (
              <ColorPickerPresetItem
                color={item}
                title={item}
                active={props.value === item}
                onClick={() => {
                  props.onChange(item);
                }}
              />
            )}
          </For>
        </div>
      </Show>
      <Show when={mode() === ColorPickerSelectionMode.gradient}>
        <div class={styles.colorGrid}>
          <For each={props.gradientColors}>
            {item => (
              <ColorPickerPresetItem
                color={item}
                title={item}
                active={props.value === item}
                onClick={() => props.onChange(item)}
              />
            )}
          </For>
        </div>
      </Show>
    </VStack>
  );
}
