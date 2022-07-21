import {getEditorSyncAdapter} from '@codeimage/store/editor/createEditorInit';
import {getRootEditorStore} from '@codeimage/store/editor';
import {getTerminalState} from '@codeimage/store/editor/terminal';
import {Box, Group, RadioBlock} from '@codeimage/ui';
import {AVAILABLE_TERMINAL_THEMES} from '@core/configuration/terminal-themes';
import {For, JSXElement, Show, Suspense} from 'solid-js';
import {Dynamic} from 'solid-js/web';
import {createTabTheme} from '../Terminal/Tabs/createTabTheme';
import {TerminalControlSkeleton} from './TerminalControlFieldSkeleton';

interface TerminalControlFieldProps {
  selectedTerminal: string;
  onTerminalChange: (type: string) => void;
}

export function TerminalControlField(
  props: TerminalControlFieldProps,
): JSXElement {
  const terminalThemes = AVAILABLE_TERMINAL_THEMES;
  const {remoteLoading} = getEditorSyncAdapter();
  const terminalState = getTerminalState();
  const {state: editorState} = getRootEditorStore();

  return (
    <Group orientation={'vertical'}>
      <For each={Object.values(terminalThemes.entries)}>
        {terminal => (
          <RadioBlock
            selected={terminal.name === props.selectedTerminal}
            value={terminal.name}
            onSelect={props.onTerminalChange}
          >
            <Box padding={2} width={'100%'}>
              <Suspense fallback={<TerminalControlSkeleton />}>
                <Show
                  when={!remoteLoading()}
                  fallback={<TerminalControlSkeleton />}
                >
                  <Dynamic
                    showTab={false}
                    shadow={'none'}
                    component={terminal.component}
                    textColor={terminalState.state.textColor}
                    background={terminalState.state.background}
                    accentVisible={true}
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
                </Show>
              </Suspense>
            </Box>
          </RadioBlock>
        )}
      </For>
    </Group>
  );
}
