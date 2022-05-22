import {offset} from '@floating-ui/dom';
import {createButton} from '@solid-aria/button';

import {createOverlayTrigger, OverlayContainer} from '@solid-aria/overlays';
import {assignInlineVars} from '@vanilla-extract/dynamic';
import {
  createEffect,
  createSignal,
  For,
  on,
  onMount,
  PropsWithChildren,
  Show,
} from 'solid-js';
import {useFloating} from '../../hooks';
import {backgroundColorVar} from '../../theme';
import {Box, VStack} from '../Box';
import {FlexField} from '../Field';
import {Popover} from '../Popover';
import {SegmentedField} from '../SegmentedField';
import {TextField} from '../TextField';
import * as styles from './ColorPicker.css';
import {ColorPickerColorItemProps} from './ColorPicker.css';

enum ColorPickerSelectionMode {
  gradient = 'gradient',
  color = 'color',
}

export interface ColorPickerProps {
  value: string | undefined;
  onChange: (value: string) => void;
  title?: string;
}

export function ColorPicker(props: PropsWithChildren<ColorPickerProps>) {
  const [mode, setMode] = createSignal(ColorPickerSelectionMode.gradient);
  const [internalColor, setInternalColor] = createSignal<string>();
  let triggerRef: HTMLButtonElement | undefined;

  const {triggerProps, overlayProps, state} = createOverlayTrigger({
    type: 'dialog',
  });

  const {buttonProps} = createButton(
    {
      onPress: () => state.open(),
    },
    () => triggerRef,
  );

  const [portal, setPortal] = createSignal<HTMLDivElement>();

  createEffect(on(() => props.value, setInternalColor));

  const floating = useFloating({
    placement: 'right-start',
    strategy: 'fixed',
    middleware: [offset(10)],
  });

  onMount(() => {
    setPortal(document.querySelector('#portal-host') as HTMLDivElement);
  });

  return (
    <>
      <button
        {...buttonProps()}
        {...triggerProps()}
        class={styles.input}
        ref={floating.setReference}
      >
        <div
          class={styles.inputColor}
          style={assignInlineVars({
            [backgroundColorVar]: props.value ?? '#000000',
          })}
        />
      </button>

      <Show when={state.isOpen()}>
        <OverlayContainer portalContainer={portal()!}>
          <Popover
            {...overlayProps()}
            ref={floating.setFloating}
            title={props.title}
            style={{
              top: `${floating.y}px`,
              left: `${floating.x}px`,
              position: floating.strategy,
            }}
            isOpen={state.isOpen()}
            onClose={state.close}
          >
            <VStack spacing={'4'}>
              <FlexField size={'md'}>
                <SegmentedField
                  value={mode()}
                  onChange={setMode}
                  items={[
                    {
                      label: 'Color',
                      value: ColorPickerSelectionMode.color,
                    },
                    {
                      label: 'Gradient',
                      value: ColorPickerSelectionMode.gradient,
                    },
                  ]}
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
                  <For
                    each={[
                      '#1e88df',
                      '#79a1ff',
                      '#1a3f95',
                      '#BD93F9',
                      '#7e3bdf',
                      '#d4b8ff',
                      '#33FF00',
                      '#64e7a3',
                      '#06535d',
                      '#AB5959',
                      '#e97171',
                      '#FFFFFF',
                      '#A2B1D2',
                      '#1e222f',
                      '#383c4a',
                      '#213043',
                      '#ffcc99',
                      '#fdad5d',
                      '#21d5b8',
                      '#e3db2a',
                      '#d01bec',
                    ]}
                  >
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
              <Show when={mode() === ColorPickerSelectionMode.gradient}>
                <div class={styles.colorGrid}>
                  <For
                    each={[
                      'linear-gradient(to right top, #7f469d, #8242aa, #833db7, #8338c4, #8233d2, #8a35da, #9336e2, #9b38ea, #af41ee, #c24af2, #d554f7, #e65ffb)',
                      'linear-gradient(to right top, #3547be, #285acd, #186ddb, #047ee7, #0090f2, #0091f3, #0091f4, #0092f5, #0082ec, #0071e2, #0060d7, #174ecb)',
                      'linear-gradient(to right bottom, #00ffc7, #00c6a5, #148f7e, #205b55, #1e2c2b)',
                      'linear-gradient(to right bottom, #e93b52, #b02d3f, #7b202c, #49131a, #200000)',
                      'linear-gradient(to right bottom, #82aaff, #6c88cb, #566899, #3f4969, #292d3e)',
                      'linear-gradient(to right bottom, #ffcc99, #f6bd83, #edad6e, #e49e59, #da8f44)',
                      'linear-gradient(135deg, #E233FF 0%, #FF6B00 100%)',
                      'linear-gradient(135deg, #FF0076 0%, #590FB7 100%)',
                      'linear-gradient(135deg, #F40076 0%, #DF98FA 100%)',
                      'linear-gradient(135deg, #402662 0%, #8000FF 100%)',
                      'linear-gradient(135deg, #2AA6DA 0%, #1B7B77 100%)',
                      'linear-gradient(135deg, #54D2EF 0%, #2AA6DA 100%)',
                      'linear-gradient(135deg, #FFE174 0%, #FFBF40 100%)',
                      'linear-gradient(135deg, #3900A6 0%, #342771 100%)',
                      'linear-gradient(135deg, #33CC99 0%, #FFCC33 100%)',
                      'linear-gradient(135deg, #CECED8 0%, #FFFFFF 100%)',
                      'linear-gradient(135deg, #402662 0%, #F59ABE 100%)',
                      'linear-gradient(to right bottom, #d44be1, #c945d7, #be3fcd, #b43ac3, #a934b9, #b330af, #bb2ca6, #c12a9c, #d6308f, #e73c83, #f34d77, #fb5f6d)',
                      'linear-gradient(to right bottom, #2be7b5, #1edea2, #16d58f, #13cb7c, #16c268, #0db866, #04ae64, #00a462, #00976c, #008971, #007b72, #006d6d)',
                    ]}
                  >
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
          </Popover>
        </OverlayContainer>
      </Show>
    </>
  );
}

type ColorPickerPresetItemProps = {
  title: string;
  color: string;
  onClick: (color: string) => void;
} & ColorPickerColorItemProps;

export function ColorPickerPresetItem(
  props: PropsWithChildren<ColorPickerPresetItemProps>,
) {
  return (
    <Box
      class={styles.colorItem({
        active: props.active,
      })}
      title={props.title}
      style={assignInlineVars({
        [backgroundColorVar]: props.color,
      })}
      onClick={() => props.onClick(props.color)}
    />
  );
}
