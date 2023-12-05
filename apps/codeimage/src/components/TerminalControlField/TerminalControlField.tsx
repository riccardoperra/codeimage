import {getRootEditorStore} from '@codeimage/store/editor';
import {getTerminalState} from '@codeimage/store/editor/terminal';
import {Box, RadioBlock} from '@codeimage/ui';
import {
  As,
  Checkbox,
  icons,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@codeui/kit';
import {AVAILABLE_TERMINAL_THEMES} from '@core/configuration/terminal-themes';
import {useModality} from '@core/hooks/isMobile';
import {createSignal, For, JSXElement, Suspense} from 'solid-js';
import {Dynamic} from 'solid-js/web';
import * as styles from '../PropertyEditor/controls/FontPicker/FontPicker.css';
import {TerminalControlSkeleton} from './TerminalControlFieldSkeleton';

interface TerminalControlFieldProps {
  selectedTerminal: string;
  showAccent: boolean;
  onTerminalChange: (type: string) => void;
  onShowAccentChange: (accent: boolean) => void;
}

export function TerminalControlField(
  props: TerminalControlFieldProps,
): JSXElement {
  const [open, setOpen] = createSignal(false);
  const terminalThemes = AVAILABLE_TERMINAL_THEMES;
  const terminalState = getTerminalState();
  const modality = useModality();
  const {state: editorState} = getRootEditorStore();
  const [controlsOnRight, setControlsOnRight] = createSignal(true);

  return (
    <Popover
      placement={modality === 'mobile' ? undefined : 'right-end'}
      modal={modality === 'full'}
      open={open()}
      onOpenChange={setOpen}
    >
      <PopoverTrigger asChild>
        <As component={'div'} class={styles.input}>
          <Box padding={2} width={'100%'}>
            <Suspense fallback={<TerminalControlSkeleton />}>
              <Dynamic
                lite
                showTab={true}
                shadow={'none'}
                component={
                  terminalThemes.entries[
                    (props.selectedTerminal as keyof typeof terminalThemes.entries) ??
                      'macOs'
                  ]?.component ?? terminalThemes.entries['macOs'].component
                }
                textColor={terminalState.state.textColor}
                background={terminalState.state.background}
                accentVisible={props.showAccent}
                readonlyTab={true}
                showHeader={true}
                showWatermark={false}
                alternativeTheme={false}
                opacity={100}
                themeId={editorState.options.themeId}
                showGlassReflection={terminalState.state.showGlassReflection}
              />
            </Suspense>
          </Box>
          <icons.SelectorIcon class={styles.inputIcon} />
        </As>
      </PopoverTrigger>
      <PopoverContent variant={'bordered'} class={styles.fontPickerPopover}>
        <div style={{display: 'flex', gap: '1rem', 'flex-direction': 'column'}}>
          <For each={Object.values(terminalThemes.entries)}>
            {terminal => (
              <RadioBlock
                selected={terminal.name === props.selectedTerminal}
                value={terminal.name}
                onSelect={props.onTerminalChange}
              >
                <Box padding={2} width={'100%'}>
                  <Suspense fallback={<TerminalControlSkeleton />}>
                    <Dynamic
                      preview={true}
                      showTab={true}
                      shadow={'none'}
                      component={terminal.component}
                      textColor={terminalState.state.textColor}
                      background={terminalState.state.background}
                      accentVisible={props.showAccent}
                      readonlyTab={true}
                      showHeader={true}
                      showWatermark={false}
                      alternativeTheme={false}
                      opacity={100}
                      themeId={editorState.options.themeId}
                      showGlassReflection={
                        terminalState.state.showGlassReflection
                      }
                    />
                  </Suspense>
                </Box>
              </RadioBlock>
            )}
          </For>
        </div>

        <Box marginTop={5}>
          <Checkbox
            checked={props.showAccent}
            onChange={props.onShowAccentChange}
            label={'Show accent'}
          />
        </Box>

        <Box marginTop={5}>
          <Checkbox
            checked={controlsOnRight()}
            onChange={setControlsOnRight}
            label={'Controls on right'}
          />
        </Box>
      </PopoverContent>
    </Popover>
  );
}
