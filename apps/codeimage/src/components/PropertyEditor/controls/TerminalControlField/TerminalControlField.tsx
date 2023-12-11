import {getRootEditorStore} from '@codeimage/store/editor';
import {getTerminalState} from '@codeimage/store/editor/terminal';
import {VersionStore} from '@codeimage/store/version/version.store';
import {Box, RadioBlock} from '@codeimage/ui';
import {As, Checkbox, icons} from '@codeui/kit';
import {TERMINAL_SHADOWS} from '@core/configuration/shadow';
import {AVAILABLE_TERMINAL_THEMES} from '@core/configuration/terminal-themes';
import {createSignal, For, JSXElement, onMount, Suspense} from 'solid-js';
import {Dynamic} from 'solid-js/web';
import {provideState} from 'statebuilder';
import {SidebarPopover} from '../../SidebarPopover/SidebarPopover';
import {SidebarPopoverTitle} from '../../SidebarPopover/SidebarPopoverTitle';
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
  const versionStore = provideState(VersionStore);
  const terminalThemes = AVAILABLE_TERMINAL_THEMES;
  const terminalState = getTerminalState();
  const {state: editorState} = getRootEditorStore();

  onMount(() => {
    versionStore.seeOnOpeningEvent({
      featureName: 'windowStylePicker',
      log: true,
      open,
    });
  });

  return (
    <SidebarPopover
      modalOnDesktop
      open={open()}
      input={
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
      }
      onOpenChange={setOpen}
    >
      <SidebarPopoverTitle onClose={() => setOpen(false)}>
        Window style
      </SidebarPopoverTitle>
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
                  showGlassReflection={terminalState.state.showGlassReflection}
                />
              </Suspense>
            </Box>
          </RadioBlock>
        )}
      </For>

      <Box marginTop={5}>
        <Checkbox
          size={'md'}
          checked={props.showAccent}
          onChange={value => props.onShowAccentChange(value)}
          label={'Show tab accent'}
        />
      </Box>
    </SidebarPopover>
  );
}
