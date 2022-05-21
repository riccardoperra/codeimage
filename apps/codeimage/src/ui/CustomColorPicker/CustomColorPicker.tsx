import {setBackground} from '@codeimage/store/frame';
import {
  Box,
  DropdownMenu,
  FlexField,
  PortalHostContext,
  SegmentedField,
  sprinkles,
  textFieldStyles,
  useFloating,
  VStack,
} from '@codeimage/ui';
import clsx from 'clsx';
import {Popover, PopoverButton} from 'solid-headless';
import {createSignal, For, Show} from 'solid-js';

enum ColorPickerSelectionMode {
  gradient = 'gradient',
  color = 'color',
}

export function CustomColorPicker(props: any) {
  const [mode, setMode] = createSignal(ColorPickerSelectionMode.gradient);
  const [color, setColor] = createSignal();

  const floating = useFloating({
    placement: 'right-end',
    strategy: 'absolute',
  });

  return (
    <Popover
      class={sprinkles({
        display: 'flex',
        width: '100%',
      })}
      defaultOpen={false}
    >
      {({isOpen}) => (
        <>
          <PopoverButton
            class={clsx(
              textFieldStyles.baseField,
              sprinkles({
                fontSize: 'sm',
                padding: 1,
                width: '100%',
              }),
            )}
            style={{
              flex: '1',
            }}
            ref={floating.setReference}
          >
            <Box
              borderRadius={'md'}
              style={{
                width: '100%',
                height: '100%',
                background: color(),
              }}
            />
          </PopoverButton>

          <Show when={isOpen()}>
            <PortalHostContext>
              <DropdownMenu
                unmount={false}
                ref={floating.setFloating}
                style={{
                  position: floating.strategy,
                  left: `300px`,
                  width: '300px',
                  top: `200px`,
                }}
              >
                <VStack spacing={'2'}>
                  <FlexField size={'md'}>
                    <SegmentedField
                      value={mode()}
                      onChange={setMode}
                      items={[
                        {label: 'Color', value: ColorPickerSelectionMode.color},
                        {
                          label: 'Gradient',
                          value: ColorPickerSelectionMode.gradient,
                        },
                      ]}
                    />
                  </FlexField>

                  <Show when={mode() === ColorPickerSelectionMode.color}>
                    <Box display={'flex'} flexWrap={'wrap'} gap={4}>
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
                          <Box
                            style={{
                              width: '44px',
                              height: '44px',
                              background: item,
                            }}
                            onClick={() => {
                              setBackground(item);
                              setColor(item);
                            }}
                            borderRadius={'full'}
                          />
                        )}
                      </For>
                    </Box>
                  </Show>
                  <Show when={mode() === ColorPickerSelectionMode.gradient}>
                    <Box display={'flex'} flexWrap={'wrap'} gap={4}>
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
                          <Box
                            style={{
                              width: '44px',
                              height: '44px',
                              background: item,
                            }}
                            onClick={() => {
                              setBackground(item);
                              setColor(item);
                            }}
                            borderRadius={'full'}
                          />
                        )}
                      </For>
                    </Box>
                  </Show>
                </VStack>
              </DropdownMenu>
            </PortalHostContext>
          </Show>
        </>
      )}
    </Popover>
  );
}
