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
import {TERMINAL_SHADOWS} from '@core/configuration/shadow';
import {AVAILABLE_TERMINAL_THEMES} from '@core/configuration/terminal-themes';
import {useModality} from '@core/hooks/isMobile';
import {createSignal, For, JSXElement, Suspense} from 'solid-js';
import {Dynamic} from 'solid-js/web';
import * as styles from './TerminalControlField.css';
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

  return (
    <Popover
      placement={modality === 'mobile' ? undefined : 'right-end'}
      modal={modality === 'full'}
      open={open()}
      onOpenChange={setOpen}
    >
      <PopoverTrigger asChild>
        <As component={'div'} class={styles.input}>
          <Box paddingTop={1} paddingBottom={1} width={'100%'}>
            <Suspense fallback={<TerminalControlSkeleton />}>
              <Dynamic
                lite
                preview={true}
                shadow={TERMINAL_SHADOWS.md}
                showTab={true}
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
                showGlassReflection={false}
              />
            </Suspense>
          </Box>
          <icons.SelectorIcon class={styles.inputIcon} />
        </As>
      </PopoverTrigger>
      <PopoverContent
        title={'Window style'}
        variant={'bordered'}
        class={styles.fontPickerPopover}
      >
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
                      shadow={TERMINAL_SHADOWS['3d']}
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
            onChange={value => props.onShowAccentChange(value)}
            label={'Show accent'}
          />
        </Box>
      </PopoverContent>
    </Popover>
  );
}
